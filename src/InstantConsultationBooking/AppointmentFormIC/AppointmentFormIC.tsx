import React, { useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";
import { api, errorMessage } from "../../api";
import { useAuth } from "../../components/Routes/AuthHook";
import { formatTime } from "../../utils/format";
import { DoctorType, NewBookingType, SlotsResponse } from "../../redux/DataType/DataType";

interface Props {
  doctor: DoctorType;
  onSubmit: (data: NewBookingType) => Promise<void>;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "YYYY-MM-DD" for a local date */
const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;


const AppointmentFormIC: React.FC<Props> = ({ doctor, onSubmit }) => {
  const { user } = useAuth();
  const today = new Date();
  const maxDate = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

  const [name, setName] = useState(user?.name ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone ?? "");
  const [date, setDate] = useState(toDateInput(today));
  const [slots, setSlots] = useState<SlotsResponse | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [timeSlot, setTimeSlot] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSlotsLoading(true);
    setTimeSlot("");
    api<SlotsResponse>(`/api/doctors/${doctor.id}/slots?date=${date}`)
      .then((data) => !cancelled && setSlots(data))
      .catch((e) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setSlotsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [doctor.id, date]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!timeSlot) {
      setError("Please pick a time slot");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({ doctorId: doctor.id, patientName: name, phoneNumber, date, timeSlot, reason });
    } catch (err) {
      setError(errorMessage(err));
      // Refresh slots in case someone else just took this one
      api<SlotsResponse>(`/api/doctors/${doctor.id}/slots?date=${date}`).then(setSlots).catch(() => {});
    } finally {
      setSubmitting(false);
    }
  };

  const availableCount = slots?.slots.filter((s) => s.available).length ?? 0;

  return (
    <form onSubmit={handleFormSubmit} className="appointment-form">
      {error && <Alert variant="danger">{error}</Alert>}
      <p className="text-muted small mb-2">
        Consults on {doctor.workingDays.map((d) => DAY_NAMES[d]).join(", ")}
        {doctor.consultationFee > 0 && ` · Fee ₦${doctor.consultationFee.toLocaleString()}`}
      </p>
      <div className="form-group">
        <label htmlFor="name">Patient name:</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
        />
      </div>
      <div className="form-group">
        <label htmlFor="phoneNumber">Phone number:</label>
        <input
          type="tel"
          id="phoneNumber"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="08012345678"
          pattern="(\+234\d{10}|0\d{10})"
          title="Nigerian number, e.g. 08012345678 or +2348012345678"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="date">Date:</label>
        <input
          type="date"
          id="date"
          value={date}
          min={toDateInput(today)}
          max={toDateInput(maxDate)}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Time:</label>
        {slotsLoading ? (
          <Spinner animation="border" size="sm" />
        ) : slots && !slots.worksThisDay ? (
          <p className="text-danger small">The doctor doesn't consult on this day. Pick another date.</p>
        ) : slots && availableCount === 0 ? (
          <p className="text-danger small">No free slots left on this day. Pick another date.</p>
        ) : (
          <div className="d-flex flex-wrap gap-2">
            {slots?.slots.map((s) => (
              <button
                type="button"
                key={s.time}
                disabled={!s.available}
                onClick={() => setTimeSlot(s.time)}
                className={`btn btn-sm ${timeSlot === s.time ? "btn-primary" : "btn-outline-primary"}`}
                style={{ minWidth: 80 }}
              >
                {formatTime(s.time)}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="form-group">
        <label htmlFor="reason">Reason for visit (optional):</label>
        <input
          type="text"
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={300}
          placeholder="e.g. Toothache, routine check-up"
        />
      </div>
      <button type="submit" disabled={submitting || !timeSlot}>
        {submitting ? "Booking..." : "Book Now"}
      </button>
    </form>
  );
};

export default AppointmentFormIC;
