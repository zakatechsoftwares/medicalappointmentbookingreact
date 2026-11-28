import { useLocation, useParams } from "react-router-dom";
import { api } from "../../api";
import { VideoJoinResponse } from "../../redux/DataType/DataType";
import VideoRoom from "../Video/VideoRoom";
import { formatLongDate, formatTime } from "../../utils/format";
import type { DeskAppointment } from "./ClinicDesk";

/** The doctor's side of a video consultation: /clinic/visit/:id */
export default function DoctorVisitPage() {
  const { id = "" } = useParams();
  const appt = (useLocation().state as { appointment?: DeskAppointment } | null)?.appointment;

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <h1 style={{ fontSize: "var(--step-2)" }}>
          {appt ? `Video call with ${appt.patientName}` : "Video consultation"}
        </h1>
        {appt && (
          <p>
            {appt.doctorName}, {formatLongDate(appt.date)} at {formatTime(appt.timeSlot)}. Reason:{" "}
            {appt.reason}
          </p>
        )}
      </div>
      <VideoRoom
        needsConsent={false}
        backTo={{ href: appt ? `/clinic?date=${appt.date}` : "/clinic", label: "Back to clinic desk" }}
        requestJoin={() =>
          api<VideoJoinResponse>(`/api/clinic/appointments/${id}/join`, { method: "POST" })
        }
      >
        <p className="notice notice-info">
          You join as the host. When you're done, mark the visit as seen on the clinic desk.
        </p>
      </VideoRoom>
    </div>
  );
}
