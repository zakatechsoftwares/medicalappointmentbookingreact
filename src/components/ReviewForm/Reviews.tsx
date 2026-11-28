import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ReviewForm from "./ReviewForm";
import { api, errorMessage } from "../../api";
import { useAppSelector } from "../../redux/store";
import { DoctorType, ReviewType } from "../../redux/DataType/DataType";
import DoctorAvatar from "../../ui/DoctorAvatar";
import Sheet from "../../ui/Sheet";

/** The doctors this patient has booked, each with their review or a button to write one. */
function Reviews() {
  const bookings = useAppSelector((s) => s.booking.bookings);
  const [doctors, setDoctors] = useState<DoctorType[]>([]);
  const [myReviews, setMyReviews] = useState<ReviewType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewing, setReviewing] = useState<DoctorType | null>(null);
  const [justSaved, setJustSaved] = useState("");

  const bookedDoctorIds = useMemo(
    () => new Set(bookings.filter((b) => b.status !== "cancelled").map((b) => b.doctorId)),
    [bookings]
  );

  useEffect(() => {
    Promise.all([api<DoctorType[]>("/api/doctors"), api<ReviewType[]>("/api/reviews/mine")])
      .then(([allDoctors, mine]) => {
        setDoctors(allDoctors);
        setMyReviews(mine);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const myDoctors = doctors.filter((d) => bookedDoctorIds.has(d.id));

  const handleSaved = (review: ReviewType) => {
    setMyReviews((list) => [...list.filter((r) => r.doctorId !== review.doctorId), review]);
    setJustSaved(review.doctorId);
    setReviewing(null);
  };

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <h1>Reviews</h1>
        <p>Rate the doctors you've seen. Honest reviews help other patients choose.</p>
      </div>

      {loading && <div className="spinner" role="status" aria-label="Loading" />}
      {error && <div className="notice notice-error">{error}</div>}

      {!loading && !error && myDoctors.length === 0 && (
        <div className="panel empty">
          <h2>Nothing to review yet</h2>
          <p>You can review a doctor once you've booked a visit with them.</p>
          <Link to="/instant-consultation" className="btn btn-primary">
            Find a doctor
          </Link>
        </div>
      )}

      {myDoctors.length > 0 && (
        <ul className="list panel">
          {myDoctors.map((doctor) => {
            const mine = myReviews.find((r) => r.doctorId === doctor.id);
            return (
              <li key={doctor.id} className="review-row">
                <DoctorAvatar name={doctor.name} speciality={doctor.speciality} />
                <div>
                  <strong>{doctor.name}</strong>
                  <p className="muted small">{doctor.speciality}</p>
                  {mine ? (
                    <p className="review-text">
                      <span className="review-stars" aria-label={`${mine.rating} out of 5 stars`}>
                        {"★".repeat(mine.rating)}
                        <span aria-hidden="true" className="review-stars-off">
                          {"★".repeat(5 - mine.rating)}
                        </span>
                      </span>
                      {mine.comment}
                    </p>
                  ) : null}
                  {justSaved === doctor.id && (
                    <p className="small" role="status" style={{ color: "var(--leaf-deep)", fontWeight: 700 }}>
                      Review saved.
                    </p>
                  )}
                </div>
                <button type="button" className={`btn btn-sm ${mine ? "btn-quiet" : "btn-primary"}`} onClick={() => setReviewing(doctor)}>
                  {mine ? "Edit" : "Write a review"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Sheet open={reviewing !== null} title={reviewing ? "Review your visit" : ""} onClose={() => setReviewing(null)}>
        {reviewing && (
          <ReviewForm
            doctor={reviewing}
            existing={myReviews.find((r) => r.doctorId === reviewing.id)}
            onSaved={handleSaved}
          />
        )}
      </Sheet>
    </div>
  );
}

export default Reviews;
