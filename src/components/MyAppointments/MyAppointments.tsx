import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/store";
import { cancelAppointment, fetchAppointments } from "../../redux/slice/bookingSlice";
import { BookingType, isActiveBooking } from "../../redux/DataType/DataType";
import ClinicCard from "../../ui/ClinicCard";
import DoctorAvatar from "../../ui/DoctorAvatar";
import { downloadCalendarFile } from "../../utils/calendar";
import { formatDate, formatTime } from "../../utils/format";
import "./MyAppointments.css";

/** Cancel asks once more inline, instead of a browser pop-up. */
function CancelButton({ booking }: { booking: BookingType }) {
  const dispatch = useAppDispatch();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const cancel = async () => {
    setBusy(true);
    setError("");
    try {
      await dispatch(cancelAppointment(booking.id)).unwrap();
    } catch (e) {
      setError(String(e));
      setBusy(false);
    }
  };

  if (!confirming) {
    return (
      <button type="button" className="btn btn-quiet btn-sm" onClick={() => setConfirming(true)}>
        Cancel appointment
      </button>
    );
  }
  return (
    <div className="cancel-confirm" role="group" aria-label="Confirm cancellation">
      <span>Cancel this visit? The time goes back to other patients.</span>
      <div>
        <button type="button" className="btn btn-danger-solid btn-sm" onClick={cancel} disabled={busy}>
          {busy ? "Cancelling…" : "Yes, cancel it"}
        </button>
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => setConfirming(false)} disabled={busy}>
          Keep it
        </button>
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

function MyAppointments() {
  const dispatch = useAppDispatch();
  const { bookings, status, error } = useAppSelector((s) => s.booking);

  const upcoming = bookings.filter(isActiveBooking);
  const past = bookings.filter((b) => !isActiveBooking(b)).reverse();

  return (
    <div className="page page-narrow">
      <div className="page-head appointments-head">
        <div>
          <h1>My appointments</h1>
          <p>Show the card at the front desk when you arrive.</p>
        </div>
        <Link to="/instant-consultation" className="btn btn-primary">
          Book another
        </Link>
      </div>

      {status === "loading" && <div className="spinner" role="status" aria-label="Loading appointments" />}
      {status === "error" && (
        <div className="notice notice-error">
          {error}{" "}
          <button type="button" className="btn-text" onClick={() => dispatch(fetchAppointments())}>
            Try again
          </button>
        </div>
      )}

      {status === "ready" && (
        <>
          {upcoming.length === 0 ? (
            <div className="panel empty">
              <h2>No upcoming visits</h2>
              <p>When you book a doctor, your clinic card will appear here.</p>
              <Link to="/instant-consultation" className="btn btn-primary">
                Find a doctor
              </Link>
            </div>
          ) : (
            <div className="appointment-stack">
              {upcoming.map((b) => (
                <ClinicCard
                  key={b.id}
                  doctorName={b.doctorName}
                  speciality={b.doctorSpeciality}
                  date={b.date}
                  timeSlot={b.timeSlot}
                  patientName={b.patientName}
                  reason={b.reason}
                  status={b.status}
                >
                  <button type="button" className="btn btn-quiet btn-sm" onClick={() => downloadCalendarFile(b)}>
                    Add to calendar
                  </button>
                  <CancelButton booking={b} />
                </ClinicCard>
              ))}
            </div>
          )}

          {past.length > 0 && (
            <section className="history" aria-labelledby="history-title">
              <h2 id="history-title">Past and cancelled</h2>
              <ul className="list panel">
                {past.map((b) => (
                  <li key={b.id} className="history-row">
                    <DoctorAvatar name={b.doctorName} speciality={b.doctorSpeciality} />
                    <div>
                      <strong>{b.doctorName}</strong>
                      <p className="muted small">
                        {formatDate(b.date)}, {formatTime(b.timeSlot)}. {b.reason}
                      </p>
                    </div>
                    <span className={`badge badge-${b.status}`}>{b.status}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default MyAppointments;
