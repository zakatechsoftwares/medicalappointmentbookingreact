import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../../api";
import { useAuth } from "../../components/Routes/AuthHook";
import { useAppDispatch } from "../../redux/store";
import { bookAppointment } from "../../redux/slice/bookingSlice";
import { BookingType, DoctorType, SlotsResponse, VisitType } from "../../redux/DataType/DataType";
import { useAppConfig } from "../../utils/appConfig";
import { VideoIcon, ClinicIcon } from "../../ui/Icons";
import DoctorAvatar from "../../ui/DoctorAvatar";
import ClinicCard from "../../ui/ClinicCard";
import { downloadCalendarFile } from "../../utils/calendar";
import { formatFee, formatLongDate, formatTime, toDateInput } from "../../utils/format";

interface Props {
  doctor: DoctorType;
  onClose: () => void;
}

const DAYS_SHOWN = 21;
const WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
const STEPS = ["Date & time", "Your details", "Confirm"];
const PHONE_RE = /^(\+234\d{10}|0\d{10})$/;

/** Three short steps: when, who, check and book. Then the clinic card. */
export default function BookingFlow({ doctor, onClose }: Props) {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { video: videoAvailable } = useAppConfig();
  const canVideo = videoAvailable && doctor.offersVideo;

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: DAYS_SHOWN }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      return { iso: toDateInput(d), day: d.getDate(), weekday: WEEKDAY.format(d), works: doctor.workingDays.includes(d.getDay()) };
    });
  }, [doctor.workingDays]);

  const [step, setStep] = useState(0);
  const [date, setDate] = useState(() => days.find((d) => d.works)?.iso ?? days[0].iso);
  const [slots, setSlots] = useState<SlotsResponse | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [timeSlot, setTimeSlot] = useState("");
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [reason, setReason] = useState("");
  const [visitType, setVisitType] = useState<VisitType>("in_person");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState<BookingType | null>(null);
  // While true, a day with no free times skips ahead to the next working day,
  // so late in the afternoon the sheet doesn't open on a fully past "today".
  const autoPick = useRef(true);

  const loadSlots = (forDate: string) =>
    api<SlotsResponse>(`/api/doctors/${doctor.id}/slots?date=${forDate}`).then(setSlots);

  useEffect(() => {
    let cancelled = false;
    setSlotsLoading(true);
    setTimeSlot("");
    setError("");
    api<SlotsResponse>(`/api/doctors/${doctor.id}/slots?date=${date}`)
      .then((data) => {
        if (cancelled) return;
        if (autoPick.current && !data.slots.some((s) => s.available)) {
          const next = days.find((d) => d.works && d.iso > date);
          if (next) {
            setDate(next.iso);
            return;
          }
        }
        autoPick.current = false;
        setSlots(data);
        setSlotsLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(errorMessage(e));
        setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [doctor.id, date, days]);

  const morning = slots?.slots.filter((s) => s.time < "12:00") ?? [];
  const afternoon = slots?.slots.filter((s) => s.time >= "12:00") ?? [];
  const freeCount = slots?.slots.filter((s) => s.available).length ?? 0;

  const nameError = name.trim().length < 2 ? "Enter the patient's full name" : "";
  const phoneError = !PHONE_RE.test(phone.trim())
    ? "Enter a Nigerian number, like 08012345678 or +2348012345678"
    : "";

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const result = await dispatch(
        bookAppointment({
          doctorId: doctor.id,
          patientName: name.trim(),
          phoneNumber: phone.trim(),
          date,
          timeSlot,
          reason: reason.trim(),
          visitType: canVideo ? visitType : "in_person",
        })
      ).unwrap();
      setBooked(result);
    } catch (e) {
      setError(String(e));
      // The slot may have just been taken: refresh and send them back to pick again
      if (/taken|passed/i.test(String(e))) {
        loadSlots(date).catch(() => {});
        setTimeSlot("");
        setStep(0);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (booked) {
    return (
      <div className="booking-done">
        <div className="notice notice-success" role="status">
          {booked.visitType === "video" ? (
            <>
              <strong>You're booked for a video call.</strong> The room opens 10 minutes before your
              time. Join from My appointments on this phone or a computer.
            </>
          ) : (
            <>
              <strong>You're booked.</strong> The clinic will confirm shortly. Show this card at the
              front desk when you arrive.
            </>
          )}
        </div>
        <ClinicCard
          doctorName={booked.doctorName}
          speciality={booked.doctorSpeciality}
          date={booked.date}
          timeSlot={booked.timeSlot}
          patientName={booked.patientName}
          reason={booked.reason}
          status={booked.status}
          visitType={booked.visitType}
        />
        <div className="booking-done-links">
          <button type="button" className="btn btn-primary" onClick={() => downloadCalendarFile(booked)}>
            Add to calendar
          </button>
          <Link to="/appointments" className="btn btn-quiet" onClick={onClose}>
            My appointments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ol className="booking-steps">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? "step" : undefined} className={i < step ? "done" : ""}>
            {label}
          </li>
        ))}
      </ol>

      <div className="booking-doctor">
        <DoctorAvatar name={doctor.name} speciality={doctor.speciality} />
        <div>
          <p>
            <strong>{doctor.name}</strong>
          </p>
          <p className="muted small">
            {doctor.speciality}
            {doctor.consultationFee > 0 && (
              <>
                , <span className="num">{formatFee(doctor.consultationFee)}</span> consultation
              </>
            )}
          </p>
        </div>
      </div>

      {error && (
        <div className="notice notice-error" role="alert">
          {error}
        </div>
      )}

      {step === 0 && (
        <>
          {canVideo && (
            <fieldset className="visit-type">
              <legend className="booking-label">How would you like to be seen?</legend>
              <label className="visit-option">
                <input
                  type="radio"
                  name="visitType"
                  value="in_person"
                  checked={visitType === "in_person"}
                  onChange={() => setVisitType("in_person")}
                />
                <ClinicIcon />
                <span>
                  <strong>At the clinic</strong>
                  <span className="muted small">For examinations, scans and tests</span>
                </span>
              </label>
              <label className="visit-option">
                <input
                  type="radio"
                  name="visitType"
                  value="video"
                  checked={visitType === "video"}
                  onChange={() => setVisitType("video")}
                />
                <VideoIcon />
                <span>
                  <strong>Video call</strong>
                  <span className="muted small">Talk to the doctor from home, on your phone</span>
                </span>
              </label>
            </fieldset>
          )}

          <span className="booking-label" id="date-label">
            Choose a day
          </span>
          <div className="date-strip" role="group" aria-labelledby="date-label">
            {days.map((d) => (
              <button
                key={d.iso}
                type="button"
                className="date-chip"
                disabled={!d.works}
                aria-pressed={date === d.iso}
                aria-label={`${formatLongDate(d.iso)}${d.works ? "" : ", doctor not in"}`}
                onClick={() => {
                  autoPick.current = false;
                  setDate(d.iso);
                }}
              >
                <span>{d.weekday}</span>
                <strong>{d.day}</strong>
              </button>
            ))}
          </div>

          <span className="booking-label">Choose a time on {formatLongDate(date)}</span>
          {slotsLoading ? (
            <div className="spinner" role="status" aria-label="Loading times" />
          ) : freeCount === 0 ? (
            <p className="notice notice-info">Every time on this day is taken. Try another day.</p>
          ) : (
            [
              ["Morning", morning],
              ["Afternoon", afternoon],
            ].map(([label, list]) =>
              (list as SlotsResponse["slots"]).length ? (
                <div className="slot-group" key={label as string}>
                  <h3>{label as string}</h3>
                  <div className="slot-grid">
                    {(list as SlotsResponse["slots"]).map((s) => (
                      <button
                        key={s.time}
                        type="button"
                        className="slot"
                        disabled={!s.available}
                        aria-pressed={timeSlot === s.time}
                        aria-label={`${formatTime(s.time)}${s.available ? "" : ", taken"}`}
                        onClick={() => setTimeSlot(s.time)}
                      >
                        {formatTime(s.time)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null
            )
          )}

          <div className="booking-actions">
            <button type="button" className="btn btn-primary" disabled={!timeSlot} onClick={() => setStep(1)}>
              {timeSlot ? `Continue with ${formatTime(timeSlot)}` : "Pick a time to continue"}
            </button>
          </div>
        </>
      )}

      {step === 1 && (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            setTouched(true);
            if (!nameError && !phoneError) setStep(2);
          }}
        >
          <div className="field">
            <label htmlFor="bk-name">Patient's name</label>
            <span className="hint">Booking for someone else? Put their name here.</span>
            <input
              id="bk-name"
              className="input"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={touched && !!nameError}
              aria-describedby={touched && nameError ? "bk-name-err" : undefined}
            />
            {touched && nameError && (
              <span className="field-error" id="bk-name-err">
                {nameError}
              </span>
            )}
          </div>
          <div className="field">
            <label htmlFor="bk-phone">Phone number</label>
            <span className="hint">The clinic will call this number if anything changes.</span>
            <input
              id="bk-phone"
              className="input"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={touched && !!phoneError}
              aria-describedby={touched && phoneError ? "bk-phone-err" : undefined}
            />
            {touched && phoneError && (
              <span className="field-error" id="bk-phone-err">
                {phoneError}
              </span>
            )}
          </div>
          <div className="field">
            <label htmlFor="bk-reason">Reason for the visit (optional)</label>
            <span className="hint">A few words help the doctor prepare.</span>
            <input
              id="bk-reason"
              className="input"
              maxLength={300}
              placeholder="e.g. toothache, routine check-up"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="booking-actions">
            <button type="button" className="btn btn-quiet" onClick={() => setStep(0)}>
              Back
            </button>
            <button type="submit" className="btn btn-primary">
              Continue
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <>
          <dl className="booking-summary">
            {canVideo && (
              <div>
                <dt>Visit</dt>
                <dd>{visitType === "video" ? "Video call" : "At the clinic"}</dd>
              </div>
            )}
            <div>
              <dt>Day</dt>
              <dd>{formatLongDate(date)}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{formatTime(timeSlot)}</dd>
            </div>
            <div>
              <dt>Patient</dt>
              <dd>{name.trim()}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{phone.trim()}</dd>
            </div>
            <div>
              <dt>Reason</dt>
              <dd>{reason.trim() || "Consultation"}</dd>
            </div>
            {doctor.consultationFee > 0 && (
              <div>
                <dt>{visitType === "video" && canVideo ? "Fee" : "Fee, paid at the clinic"}</dt>
                <dd>{formatFee(doctor.consultationFee)}</dd>
              </div>
            )}
          </dl>
          <p className="muted small">You can cancel from My appointments any time before your visit.</p>
          <div className="booking-actions">
            <button type="button" className="btn btn-quiet" onClick={() => setStep(1)} disabled={submitting}>
              Back
            </button>
            <button type="button" className="btn btn-primary" onClick={submit} disabled={submitting}>
              {submitting ? "Booking…" : "Book appointment"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
