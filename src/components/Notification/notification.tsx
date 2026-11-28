import { Link, useLocation } from "react-router-dom";
import { useAppSelector } from "../../redux/store";
import { formatDate, formatTime } from "../../utils/format";
import { isActiveBooking } from "../../redux/DataType/DataType";

/** One quiet line under the header with the patient's next visit. */
const Notification = () => {
  const { pathname } = useLocation();
  const next = useAppSelector((state) => state.booking.bookings.find(isActiveBooking));

  // Not needed on the page that already lists appointments
  if (!next || pathname === "/appointments") return null;

  return (
    <div className="next-visit">
      <div className="next-visit-inner">
        <span className={`badge badge-${next.status}`}>{next.status}</span>
        <span>
          Next visit: <strong>{next.doctorName}</strong>,{" "}
          <span className="num">
            {formatDate(next.date)} at {formatTime(next.timeSlot)}
          </span>
        </span>
        <Link to="/appointments">See details</Link>
      </div>
    </div>
  );
};

export default Notification;
