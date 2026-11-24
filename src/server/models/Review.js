import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "doctor", required: true, index: true },
    authorName: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

// One review per patient per doctor (editing replaces it)
reviewSchema.index({ user: 1, doctor: 1 }, { unique: true });

reviewSchema.methods.toPublic = function toPublic() {
  return {
    id: this.id,
    doctorId: String(this.doctor),
    author: this.authorName,
    rating: this.rating,
    comment: this.comment,
    createdAt: this.createdAt,
  };
};

export default mongoose.model("review", reviewSchema);
