/** "09:30" -> "9:30 AM" */
export const formatTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

/** "2026-11-25" -> "Wed Nov 25 2026" */
export const formatDate = (d: string) => new Date(`${d}T00:00`).toDateString();
