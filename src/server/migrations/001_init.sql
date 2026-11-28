-- StayHealthy booking portal: initial schema (PostgreSQL)
--
-- Shaped to line up with the Horama EMR's Prisma schema: UUID ids, firstName/lastName,
-- the same AppointmentStatus values, camelCase column names and a `reason` on
-- appointments. That lets bookings be copied into the EMR's "appointments" table later.
-- emrPatientId / emrUserId / emrAppointmentId hold the matching EMR ids once linked.
--
-- Everything lives in its own "booking" schema so it can share a database with
-- other apps, and Supabase doesn't expose it through its public REST API.

CREATE TYPE booking."PortalRole" AS ENUM ('PATIENT', 'ADMIN');
-- Same values as the EMR's AppointmentStatus
CREATE TYPE booking."AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

CREATE TABLE booking.portal_users (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"        TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "firstName"    TEXT NOT NULL,
  "lastName"     TEXT NOT NULL DEFAULT '',
  "phone"        TEXT NOT NULL,
  "role"         booking."PortalRole" NOT NULL DEFAULT 'PATIENT',
  "emrPatientId" TEXT,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE booking.doctors (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title"           TEXT NOT NULL DEFAULT 'Dr.',
  "firstName"       TEXT NOT NULL,
  "lastName"        TEXT NOT NULL,
  "speciality"      TEXT NOT NULL,
  "experience"      INTEGER NOT NULL CHECK ("experience" >= 0),
  "profilePic"      TEXT,
  "consultationFee" NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK ("consultationFee" >= 0),
  -- 0 = Sunday ... 6 = Saturday
  "workingDays"     SMALLINT[] NOT NULL DEFAULT '{1,2,3,4,5}',
  "timeSlots"       TEXT[] NOT NULL DEFAULT
    '{09:00,09:30,10:00,10:30,11:00,11:30,13:00,13:30,14:00,14:30,15:00,15:30}',
  "ratingAverage"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "ratingCount"     INTEGER NOT NULL DEFAULT 0,
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "emrUserId"       TEXT UNIQUE,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("title", "firstName", "lastName", "speciality")
);
CREATE INDEX doctors_speciality_idx ON booking.doctors (lower("speciality"));

CREATE TABLE booking.appointments (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"           UUID NOT NULL REFERENCES booking.portal_users ("id") ON DELETE CASCADE,
  "doctorId"         UUID NOT NULL REFERENCES booking.doctors ("id"),
  "patientName"      TEXT NOT NULL,
  "phoneNumber"      TEXT NOT NULL,
  "date"             DATE NOT NULL,
  "timeSlot"         TEXT NOT NULL CHECK ("timeSlot" ~ '^\d{2}:\d{2}$'),
  "status"           booking."AppointmentStatus" NOT NULL DEFAULT 'PENDING',
  "reason"           TEXT NOT NULL DEFAULT 'Consultation',
  "notes"            TEXT,
  "emrAppointmentId" TEXT UNIQUE,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX appointments_user_idx ON booking.appointments ("userId");
CREATE INDEX appointments_doctor_date_idx ON booking.appointments ("doctorId", "date");
-- Only one active (pending or confirmed) booking per doctor, date and slot.
-- Two people clicking "Book" at the same moment can't both get it.
CREATE UNIQUE INDEX appointments_active_slot_key
  ON booking.appointments ("doctorId", "date", "timeSlot")
  WHERE "status" IN ('PENDING', 'CONFIRMED');

CREATE TABLE booking.reviews (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"     UUID NOT NULL REFERENCES booking.portal_users ("id") ON DELETE CASCADE,
  "doctorId"   UUID NOT NULL REFERENCES booking.doctors ("id"),
  "authorName" TEXT NOT NULL,
  "rating"     INTEGER NOT NULL CHECK ("rating" BETWEEN 1 AND 5),
  "comment"    TEXT NOT NULL,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("userId", "doctorId")
);
CREATE INDEX reviews_doctor_idx ON booking.reviews ("doctorId");
