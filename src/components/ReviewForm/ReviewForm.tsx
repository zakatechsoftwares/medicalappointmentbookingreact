import { useState } from "react";
import { api, errorMessage } from "../../api";
import { DoctorType, ReviewType } from "../../redux/DataType/DataType";
import { StarInput } from "../../ui/Stars";

interface Props {
  doctor: DoctorType;
  existing?: ReviewType;
  onSaved: (review: ReviewType) => void;
}

function ReviewForm({ doctor, existing, onSaved }: Props) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const ratingError = !rating ? "Choose from 1 to 5 stars" : "";
  const commentError = comment.trim().length < 3 ? "Write a few words about your visit" : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (ratingError || commentError) return;
    setSaving(true);
    setError("");
    try {
      const review = await api<ReviewType>("/api/reviews", {
        method: "POST",
        body: { doctorId: doctor.id, rating, comment: comment.trim() },
      });
      onSaved(review);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <div className="notice notice-error" role="alert">
          {error}
        </div>
      )}
      <div className="field">
        <span className="booking-label" style={{ margin: 0 }}>
          How was your visit with {doctor.name}?
        </span>
        <StarInput value={rating} onChange={setRating} />
        {touched && ratingError && <span className="field-error">{ratingError}</span>}
      </div>
      <div className="field">
        <label htmlFor="rv-comment">Your review</label>
        <span className="hint">Other patients will see this with your name.</span>
        <textarea
          id="rv-comment"
          className="input"
          rows={4}
          maxLength={1000}
          placeholder="Was the wait short? Did the doctor explain things clearly?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          aria-invalid={touched && !!commentError}
        />
        {touched && commentError && <span className="field-error">{commentError}</span>}
      </div>
      <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
        {saving ? "Saving…" : existing ? "Update review" : "Post review"}
      </button>
    </form>
  );
}

export default ReviewForm;
