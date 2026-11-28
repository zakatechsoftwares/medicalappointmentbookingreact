import { Link, useParams } from "react-router-dom";
import { api } from "../../api";
import { useAppDispatch, useAppSelector } from "../../redux/store";
import { fetchAppointments } from "../../redux/slice/bookingSlice";
import { VideoJoinResponse } from "../../redux/DataType/DataType";
import DoctorAvatar from "../../ui/DoctorAvatar";
import { formatLongDate, formatTime } from "../../utils/format";
import VideoRoom from "./VideoRoom";

/** The patient's video consultation page: /visit/:id */
export default function VisitPage() {
  const { id = "" } = useParams();
  const dispatch = useAppDispatch();
  const { bookings, status } = useAppSelector((s) => s.booking);
  const booking = bookings.find((b) => b.id === id);

  if (status !== "ready") return <div className="spinner" role="status" aria-label="Loading" />;

  if (!booking || booking.visitType !== "video") {
    return (
      <div className="page page-narrow">
        <div className="panel empty">
          <h2>We can't find that video visit</h2>
          <p>It may have been cancelled, or it's an in-person appointment.</p>
          <Link to="/appointments" className="btn btn-primary">
            My appointments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-narrow">
      <div className="video-visit-head">
        <DoctorAvatar name={booking.doctorName} speciality={booking.doctorSpeciality} />
        <div>
          <h1 style={{ fontSize: "var(--step-2)", margin: 0 }}>Video call with {booking.doctorName}</h1>
          <p className="muted">
            {formatLongDate(booking.date)} at {formatTime(booking.timeSlot)}, for {booking.patientName}
          </p>
        </div>
      </div>
      <VideoRoom
        needsConsent={!booking.videoConsented}
        opensAt={booking.videoOpensAt}
        backTo={{ href: "/appointments", label: "My appointments" }}
        requestJoin={async (consent) => {
          const res = await api<VideoJoinResponse>(`/api/appointments/${booking.id}/join`, {
            method: "POST",
            body: { consent },
          });
          if (!booking.videoConsented) dispatch(fetchAppointments()); // remember the consent
          return res;
        }}
      />
    </div>
  );
}
