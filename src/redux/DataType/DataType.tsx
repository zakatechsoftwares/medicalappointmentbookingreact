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
export type AppointmentStatus = "booked" | "cancelled" | "completed";

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
  createdAt: string;
}

export interface NewBookingType {
  doctorId: string;
  patientName: string;
  phoneNumber: string;
  date: string;
  timeSlot: string;
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
