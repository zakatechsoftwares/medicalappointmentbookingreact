import { BookingType } from "../redux/DataType/DataType";

const pad = (n: number) => String(n).padStart(2, "0");
const esc = (s: string) => s.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");

/**
 * Downloads an .ics file so the visit lands in the phone's calendar app,
 * with a reminder the evening before (18 hours ahead) and one hour before.
 */
export function downloadCalendarFile(b: BookingType, minutes = 30) {
  const [y, m, d] = b.date.split("-").map(Number);
  const [hh, mm] = b.timeSlot.split(":").map(Number);
  // Times are local to the clinic; floating local time keeps them correct on the patient's phone
  const start = `${y}${pad(m)}${pad(d)}T${pad(hh)}${pad(mm)}00`;
  const endDate = new Date(y, m - 1, d, hh, mm + minutes);
  const end = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//StayHealthy//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${b.id}@stayhealthy`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${esc(`Appointment with ${b.doctorName}`)}`,
    `DESCRIPTION:${esc(`${b.doctorSpeciality}. Patient: ${b.patientName}. Reason: ${b.reason}`)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT18H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Doctor's appointment tomorrow",
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Doctor's appointment in 1 hour",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `appointment-${b.date}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
