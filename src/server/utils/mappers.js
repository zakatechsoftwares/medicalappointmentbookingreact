// Turn database rows into the JSON shapes the React app expects.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v) => typeof v === "string" && UUID_RE.test(v);

/** "Abdul Rahman Bello" -> { firstName: "Abdul Rahman", lastName: "Bello" } (EMR stores names split) */
export function splitName(full) {
  const parts = String(full).trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] };
}

export const fullName = (row) => [row.firstName, row.lastName].filter(Boolean).join(" ");

export const ACTIVE_STATUSES = ["PENDING", "CONFIRMED"];

export function toPublicUser(row) {
  return {
    id: row.id,
    name: fullName(row),
    email: row.email,
    phone: row.phone,
    role: row.role.toLowerCase(),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toPublicDoctor(row) {
  return {
    id: row.id,
    name: `${row.title} ${fullName(row)}`.trim(),
    speciality: row.speciality,
    experience: row.experience,
    profilePic: row.profilePic || "",
    consultationFee: row.consultationFee,
    workingDays: row.workingDays,
    ratings: Math.round(row.ratingAverage * 10) / 10,
    ratingCount: row.ratingCount,
  };
}

/** Expects an appointment row joined with doctor columns aliased doctorTitle/doctorFirstName/... */
export function toPublicAppointment(row) {
  return {
    id: row.id,
    patientName: row.patientName,
    phoneNumber: row.phoneNumber,
    date: row.date,
    timeSlot: row.timeSlot,
    status: row.status.toLowerCase(),
    reason: row.reason,
    doctorId: row.doctorId,
    doctorName: `${row.doctorTitle} ${row.doctorFirstName} ${row.doctorLastName}`.trim(),
    doctorSpeciality: row.doctorSpeciality,
    createdAt: row.createdAt,
  };
}

export function toPublicReview(row) {
  return {
    id: row.id,
    doctorId: row.doctorId,
    author: row.authorName,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt,
  };
}
