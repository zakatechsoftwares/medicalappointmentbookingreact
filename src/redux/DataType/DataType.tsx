// --------------------------- Doctors ---------------------------
export interface DoctorType {
  id: string;
  name: string;
  speciality: string;
  experience: number;
  profilePic: string;
  consultationFee: number;
  workingDays: number[];
  ratings: number;
  ratingCount: number;
}

export interface SlotType {
  time: string;
  available: boolean;
}

export interface SlotsResponse {
  date: string;
  worksThisDay: boolean;
  slots: SlotType[];
}

// --------------------------- Reviews ---------------------------
export interface ReviewType {
  id: string;
  doctorId: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// --------------------------- Appointments ---------------------------
// Same values as the EMR (lower-cased). "pending" = booked online, awaiting the clinic's confirmation.
export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export const isActiveBooking = (b: { status: AppointmentStatus }) =>
  b.status === "pending" || b.status === "confirmed";

export interface BookingType {
  id: string;
  patientName: string;
  phoneNumber: string;
  doctorId: string;
  doctorName: string;
  doctorSpeciality: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:MM
  status: AppointmentStatus;
  reason: string;
  createdAt: string;
}

export interface NewBookingType {
  doctorId: string;
  patientName: string;
  phoneNumber: string;
  date: string;
  timeSlot: string;
  reason?: string;
}

// --------------------------- Medical report ---------------------------
export interface ReportDataType {
  name: string;
  email: string;
  phoneNumber: string;
  doctorName: string;
  speciality: string;
}

// --------------------------- User ---------------------------
export interface UserType {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}
