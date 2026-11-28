import { useState } from "react";
import Alert from "react-bootstrap/Alert";
import { Link } from "react-router-dom";
import { useAppSelector } from "../../redux/store";
import { formatDate, formatTime } from "../../utils/format";
import { isActiveBooking } from "../../redux/DataType/DataType";

/** A small banner showing the patient's next appointment. */
const Notification = () => {
  const [dismissed, setDismissed] = useState<string | null>(null);
  const next = useAppSelector((state) =>
    state.booking.bookings.find(isActiveBooking)
  );

  if (!next || dismissed === next.id) return null;

  return (
    <Alert
      variant="info"
      dismissible
      onClose={() => setDismissed(next.id)}
      className="mx-3 mb-0"
    >
      <strong>Next appointment:</strong> {next.doctorName} ({next.doctorSpeciality}) on{" "}
      {formatDate(next.date)} at {formatTime(next.timeSlot)}.{" "}
      <Link to="/appointments">View all</Link>
    </Alert>
  );
};

export default Notification;
