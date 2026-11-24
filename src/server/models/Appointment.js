import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "doctor", required: true },
    patientName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    // Stored as "YYYY-MM-DD" so a slot means the same day for everyone
    date: { type: String, required: true },
    timeSlot: { type: String, required: true },
    status: {
      type: String,
      enum: ["booked", "cancelled", "completed"],
      default: "booked",
    },
  },
  { timestamps: true }
);

// A doctor can only have one active booking per date and time slot.
// The database enforces this, so two people clicking "Book" at once can't both win.
appointmentSchema.index(
  { doctor: 1, date: 1, timeSlot: 1 },
  { unique: true, partialFilterExpression: { status: "booked" } }
);

appointmentSchema.methods.toPublic = function toPublic() {
  const doctor = this.populated("doctor") ? this.doctor : null;
  return {
    id: this.id,
    patientName: this.patientName,
    phoneNumber: this.phoneNumber,
    date: this.date,
    timeSlot: this.timeSlot,
    status: this.status,
    doctorId: doctor ? doctor.id : String(this.doctor),
    doctorName: doctor ? doctor.name : undefined,
    doctorSpeciality: doctor ? doctor.speciality : undefined,
    createdAt: this.createdAt,
  };
};

export default mongoose.model("appointment", appointmentSchema);
