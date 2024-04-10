// -------------------------reviews-------------------------
export interface ReviewType {
  id: string;
  author: string;
  comment: string;
  doctorName: string;
}

export interface DoctorReviewType {
  name: string;
  review: ReviewType[];
}

//---------------------------Reviews------------------------
export interface DoctorType {
  name: string;
  ratings: number;
  experience: number;
  speciality: string;
  profilePic: string;
}

//---------------------------bookingSlice Datatypes-----------------------------
export interface BookingType {
  id: string;
  name: string;
  phoneNumber: string;
  doctorName: string;
  doctorSpeciality: string;
  dateOfAppointment: string;
  timeSlot: string;
}

//--------------Redux storeStateType
export interface ReviewReviewType {
  reviews: DoctorReviewType[];
}

export interface ReduxStoreStateType {
  reviews: ReviewReviewType;
  bookings: BookingType[];
}
