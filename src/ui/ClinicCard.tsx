import "./ClinicCard.css";
import { formatTime } from "../utils/format";

interface Props {
  doctorName: string;
  speciality: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:MM
  patientName: string;
  status?: string;
  reason?: string;
  children?: React.ReactNode; // actions under the card
}

const DAY = new Intl.DateTimeFormat("en-NG", { weekday: "long" });
const MONTH = new Intl.DateTimeFormat("en-NG", { month: "short", year: "numeric" });

/**
 * The tear-off appointment card patients get from a clinic's front desk.
 * Left stub: the date, large. Right: who, with whom, when.
 */
export default function ClinicCard({
  doctorName,
  speciality,
  date,
  timeSlot,
  patientName,
  status,
  reason,
  children,
}: Props) {
  const d = new Date(`${date}T00:00`);
  return (
    <article className="clinic-card" aria-label={`Appointment with ${doctorName}`}>
      <div className="clinic-card-stub">
        <span className="clinic-card-day">{DAY.format(d)}</span>
        <span className="clinic-card-date">{d.getDate()}</span>
        <span className="clinic-card-month">{MONTH.format(d)}</span>
        <span className="clinic-card-time">{formatTime(timeSlot)}</span>
      </div>
      <div className="clinic-card-body">
        <div className="clinic-card-row">
          <span className="clinic-card-brand">StayHealthy clinic card</span>
          {status && <span className={`badge badge-${status}`}>{status}</span>}
        </div>
        <h3 className="clinic-card-doctor">{doctorName}</h3>
        <p className="clinic-card-spec">{speciality}</p>
        <dl className="clinic-card-meta">
          <div>
            <dt>Patient</dt>
            <dd>{patientName}</dd>
          </div>
          {reason && (
            <div>
              <dt>Reason</dt>
              <dd>{reason}</dd>
            </div>
          )}
        </dl>
        {children && <div className="clinic-card-actions">{children}</div>}
      </div>
    </article>
  );
}
