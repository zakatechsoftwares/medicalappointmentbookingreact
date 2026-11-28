// Clinic time zone used to decide what "today" and "already passed" mean.
const TIME_ZONE = process.env.APP_TIMEZONE || "Africa/Lagos";

/** Returns { date: "YYYY-MM-DD", time: "HH:MM" } for now in the clinic time zone. */
export function nowInClinic(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

/** Day of week (0 = Sunday) for a "YYYY-MM-DD" string. */
export function dayOfWeek(dateString) {
  return new Date(`${dateString}T12:00:00Z`).getUTCDay();
}

export function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** True if the given date + slot is already in the past. */
export function isPast(dateString, timeSlot, now = new Date()) {
  const current = nowInClinic(now);
  if (dateString < current.date) return true;
  if (dateString > current.date) return false;
  return timeSlot <= current.time;
}

/** Furthest ahead a patient can book. */
export const MAX_DAYS_AHEAD = 60;

export function isTooFarAhead(dateString, now = new Date()) {
  const limit = new Date(now.getTime() + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000);
  return dateString > nowInClinic(limit).date;
}
