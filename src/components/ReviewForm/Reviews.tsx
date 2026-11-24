import { useEffect, useMemo, useState } from "react";
import Container from "react-bootstrap/Container";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";
import { Link } from "react-router-dom";
import Popup from "reactjs-popup";
import ReviewForm from "./ReviewForm";
import { api, errorMessage } from "../../api";
import { useAppSelector } from "../../redux/store";
import { DoctorType, ReviewType } from "../../redux/DataType/DataType";

/** Lists the doctors the patient has booked, so they can rate them. */
function Reviews() {
  const bookings = useAppSelector((s) => s.booking.bookings);
  const [doctors, setDoctors] = useState<DoctorType[]>([]);
  const [myReviews, setMyReviews] = useState<ReviewType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewing, setReviewing] = useState<DoctorType | null>(null);

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
    setReviewing(null);
  };

  return (
    <Container className="py-4">
      <h2>Reviews</h2>
      {loading && <Spinner animation="border" />}
      {error && <Alert variant="danger">{error}</Alert>}
      {!loading && !error && myDoctors.length === 0 && (
        <p className="text-muted">
          You can review a doctor once you've booked an appointment with them.{" "}
          <Link to="/instant-consultation">Find a doctor</Link>
        </p>
      )}
      {myDoctors.length > 0 && (
        <Table responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Doctor's Name</th>
              <th>Speciality</th>
              <th>Your review</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {myDoctors.map((doctor, index) => {
              const mine = myReviews.find((r) => r.doctorId === doctor.id);
              return (
                <tr key={doctor.id}>
                  <td>{index + 1}</td>
                  <td>{doctor.name}</td>
                  <td>{doctor.speciality}</td>
                  <td>
                    {mine ? (
                      <>
                        {"★".repeat(mine.rating)}
                        {"☆".repeat(5 - mine.rating)} — {mine.comment}
                      </>
                    ) : (
                      <span className="text-muted">No review yet</span>
                    )}
                  </td>
                  <td>
                    <Button size="sm" onClick={() => setReviewing(doctor)}>
                      {mine ? "Edit" : "Review"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
      <Popup modal open={reviewing !== null} onClose={() => setReviewing(null)}>
        {reviewing && (
          <ReviewForm
            doctor={reviewing}
            existing={myReviews.find((r) => r.doctorId === reviewing.id)}
            onSaved={handleSaved}
          />
        )}
      </Popup>
    </Container>
  );
}

export default Reviews;
