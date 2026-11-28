-- Video consultations (telemedicine) through Daily.co
--
-- visitType: how the patient will be seen. Video bookings get a private Daily room,
-- created when the booking is made and deleted if it's cancelled.
-- videoConsentAt: when the patient agreed to be seen by video (Nigeria Data Protection
-- Act: record consent before processing health data over a new channel).

CREATE TYPE booking."VisitType" AS ENUM ('IN_PERSON', 'VIDEO');

ALTER TABLE booking.appointments
  ADD COLUMN "visitType"      booking."VisitType" NOT NULL DEFAULT 'IN_PERSON',
  ADD COLUMN "videoRoomName"  TEXT UNIQUE,
  ADD COLUMN "videoRoomUrl"   TEXT,
  ADD COLUMN "videoConsentAt" TIMESTAMPTZ;

ALTER TABLE booking.doctors
  ADD COLUMN "offersVideo" BOOLEAN NOT NULL DEFAULT true;

-- The clinic desk lists appointments by day
CREATE INDEX appointments_date_idx ON booking.appointments ("date", "timeSlot");
