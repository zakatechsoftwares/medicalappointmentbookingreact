import mongoose from "mongoose";

export const DEFAULT_TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
];

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    speciality: { type: String, required: true, trim: true, index: true },
    experience: { type: Number, required: true, min: 0 },
    profilePic: { type: String, default: "" },
    consultationFee: { type: Number, default: 0, min: 0 },
    // 0 = Sunday ... 6 = Saturday
    workingDays: { type: [Number], default: [1, 2, 3, 4, 5] },
    timeSlots: { type: [String], default: DEFAULT_TIME_SLOTS },
    // Updated whenever a review is added or changed
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

doctorSchema.methods.toPublic = function toPublic() {
  return {
    id: this.id,
    name: this.name,
    speciality: this.speciality,
    experience: this.experience,
    profilePic: this.profilePic,
    consultationFee: this.consultationFee,
    workingDays: this.workingDays,
    ratings: Math.round(this.ratingAverage * 10) / 10,
    ratingCount: this.ratingCount,
  };
};

export default mongoose.model("doctor", doctorSchema);
