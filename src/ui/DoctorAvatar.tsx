// Initials on a soft colour picked per speciality, so a list of doctors scans by field.
const TINTS: Record<string, string> = {
  dentist: "#d8ecf2",
  "gynecologist/obstetrician": "#f6e0e6",
  "general physician": "#ddefe5",
  dermatologist: "#f5e7d3",
  "ear-nose-throat (ent) specialist": "#e5e2f3",
  paediatrician: "#fbefd9",
};

function initials(name: string) {
  return name
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function DoctorAvatar({ name, speciality }: { name: string; speciality: string }) {
  return (
    <span
      className="avatar"
      style={{ background: TINTS[speciality.toLowerCase()] ?? "#e7ecea" }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
