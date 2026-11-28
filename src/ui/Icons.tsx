// Small line icons, drawn to match the 2px stroke of the rest of the interface.

export function VideoIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="icon">
      <rect x="2.5" y="6" width="13" height="12" rx="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="M15.5 10.5l5-3v9l-5-3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function ClinicIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="icon">
      <path d="M3.5 20.5V9l8.5-5.5L20.5 9v11.5h-17z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 10v6M9 13h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
