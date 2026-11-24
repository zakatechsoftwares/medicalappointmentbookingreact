import { useState } from "react";
import Button from "react-bootstrap/Button";
import FormGroup from "react-bootstrap/FormGroup";
import FormLabel from "react-bootstrap/FormLabel";
import FormControl from "react-bootstrap/FormControl";
import Alert from "react-bootstrap/Alert";
import { Rating } from "react-simple-star-rating";
import { api, errorMessage } from "../../api";
import { DoctorType, ReviewType } from "../../redux/DataType/DataType";

interface Props {
  doctor: DoctorType;
  existing?: ReviewType;
  onSaved: (review: ReviewType) => void;
}

function ReviewForm({ doctor, existing, onSaved }: Props) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setError("Please choose a star rating");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const review = await api<ReviewType>("/api/reviews", {
        method: "POST",
        body: { doctorId: doctor.id, rating, comment },
      });
      onSaved(review);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3">
      <FormLabel className="fs-4">
        {existing ? "Update your review" : "Review"} {doctor.name}
      </FormLabel>
      {error && <Alert variant="danger">{error}</Alert>}
      <FormGroup className="mb-3">
        <FormLabel className="fw-bold">Rating:</FormLabel>
        <div>
          <Rating initialValue={rating} onClick={(value: number) => setRating(value)} size={28} />
        </div>
      </FormGroup>
      <FormGroup className="mb-3" controlId="reviewComment">
        <FormLabel className="fw-bold">Review:</FormLabel>
        <FormControl
          as="textarea"
          rows={3}
          placeholder="How was your consultation?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          required
          minLength={3}
        />
      </FormGroup>
      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Submit review"}
      </Button>
    </form>
  );
}

export default ReviewForm;
