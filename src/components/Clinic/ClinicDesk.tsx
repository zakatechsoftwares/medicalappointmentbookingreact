import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, errorMessage } from "../../api";
import { BookingType } from "../../redux/DataType/DataType";
import { VideoIcon, ClinicIcon } from "../../ui/Icons";
import { formatLongDate, formatTime, toDateInput } from "../../utils/format";
import "./Clinic.css";

export interface DeskAppointment extends BookingType {
  accountName: string;
  accountEmail: string;
  hasVideoRoom: boolean;
}

const shiftDate = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00`);
  d.setDate(d.getDate() + days);
  return toDateInput(d);
};

/** Staff view of one day's bookings: confirm, complete, cancel, and start video calls. */
export default function ClinicDesk() {
  const [params, setParams] = useSearchParams();
  const date = params.get("date") || toDateInput(new Date());
  const [items, setItems] = useState<DeskAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    api<{ appointments: DeskAppointment[] }>(`/api/clinic/appointments?date=${date}`)
      .then((r) => setItems(r.appointments))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(load, [load]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const setStatus = async (a: DeskAppointment, status: "confirmed" | "completed" | "cancelled") => {
    setBusy(a.id);
    setError("");
    try {
      const updated = await api<DeskAppointment>(`/api/clinic/appointments/${a.id}/status`, {
        method: "PATCH",
        body: { status },
      });
      setItems((list) => list.map((x) => (x.id === a.id ? updated : x)));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const active = items.filter((a) => a.status === "pending" || a.status === "confirmed");
  const pendingCount = items.filter((a) => a.status === "pending").length;

  return (
    <div className="page">
      <div className="page-head">
        <h1>Clinic desk</h1>
        <p>
          {loading
            ? "Loading the day…"
            : `${active.length} upcoming on ${formatLongDate(date)}${pendingCount ? `, ${pendingCount} waiting for confirmation` : ""}.`}
        </p>
      </div>

      <div className="desk-dates" role="group" aria-label="Choose a day">
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => setParams({ date: shiftDate(date, -1) })}>
          Previous day
        </button>
        <label className="visually-hidden" htmlFor="desk-date">
          Day
        </label>
        <input
          id="desk-date"
          type="date"
          className="input desk-date-input"
          value={date}
          onChange={(e) => e.target.value && setParams({ date: e.target.value })}
        />
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => setParams({ date: shiftDate(date, 1) })}>
          Next day
        </button>
        {date !== toDateInput(new Date()) && (
          <button type="button" className="btn-text" onClick={() => setParams({})}>
            Today
          </button>
        )}
      </div>

      {error && (
        <div className="notice notice-error" role="alert">
          {error}
        </div>
      )}
      {loading && <div className="spinner" role="status" aria-label="Loading" />}

      {!loading && items.length === 0 && (
        <div className="panel empty">
          <h2>No bookings on this day</h2>
          <p>New online bookings show up here as patients make them.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <ul className="list panel">
          {items.map((a) => {
            const open =
              a.visitType === "video" &&
              a.videoOpensAt &&
              a.videoClosesAt &&
              now >= Date.parse(a.videoOpensAt) &&
              now <= Date.parse(a.videoClosesAt);
            const isActive = a.status === "pending" || a.status === "confirmed";
            return (
              <li key={a.id} className={`desk-row ${isActive ? "" : "is-done"}`}>
                <div className="desk-time num">{formatTime(a.timeSlot)}</div>
                <div className="desk-main">
                  <p className="desk-patient">
                    <strong>{a.patientName}</strong>
                    <span className={`badge badge-${a.status}`}>{a.status}</span>
                  </p>
                  <p className="muted small">
                    {a.doctorName}, {a.doctorSpeciality}
                  </p>
                  <p className="small desk-meta">
                    <span className="desk-type">
                      {a.visitType === "video" ? <VideoIcon size={16} /> : <ClinicIcon size={16} />}
                      {a.visitType === "video" ? "Video call" : "At the clinic"}
                    </span>
                    <span>{a.reason}</span>
                    <a href={`tel:${a.phoneNumber}`}>{a.phoneNumber}</a>
                  </p>
                </div>
                <div className="desk-actions">
                  {open && isActive && (
                    <Link
                      to={`/clinic/visit/${a.id}`}
                      state={{ appointment: a }}
                      className="btn btn-primary btn-sm"
                    >
                      Start video call
                    </Link>
                  )}
                  {a.status === "pending" && (
                    <button
                      type="button"
                      className={`btn btn-sm ${open ? "btn-quiet" : "btn-primary"}`}
                      disabled={busy === a.id}
                      onClick={() => setStatus(a, "confirmed")}
                    >
                      Confirm
                    </button>
                  )}
                  {a.status === "confirmed" && (
                    <button type="button" className="btn btn-quiet btn-sm" disabled={busy === a.id} onClick={() => setStatus(a, "completed")}>
                      Mark as seen
                    </button>
                  )}
                  {isActive && (
                    <button type="button" className="btn-text small" disabled={busy === a.id} onClick={() => setStatus(a, "cancelled")}>
                      Cancel
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
