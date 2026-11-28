/** "09:30" -> "9:30 AM" */
export const formatTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

const dateFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });
const longDateFmt = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" });

/** "2026-12-02" -> "Wed 2 Dec" */
export const formatDate = (d: string) => dateFmt.format(new Date(`${d}T00:00`));

/** "2026-12-02" -> "Wednesday 2 December" */
export const formatLongDate = (d: string) => longDateFmt.format(new Date(`${d}T00:00`));

/** 10000 -> "₦10,000" */
export const formatFee = (n: number) => `₦${n.toLocaleString("en-NG")}`;

/** Local date as YYYY-MM-DD */
export const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** [1,2,3,4,5] -> "Mon to Fri"; [2,4,6] -> "Tue, Thu, Sat" */
export function formatWorkingDays(days: number[]) {
  const sorted = [...days].sort((a, b) => a - b);
  const consecutive = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
  if (sorted.length >= 3 && consecutive) {
    return `${DAY_NAMES[sorted[0]]} to ${DAY_NAMES[sorted[sorted.length - 1]]}`;
  }
  return sorted.map((d) => DAY_NAMES[d]).join(", ");
}
