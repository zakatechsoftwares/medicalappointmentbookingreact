import { useState } from "react";

const PATH =
  "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z";

/** Read-only star rating, e.g. 4.3 out of 5 */
export function StarRating({ value, count }: { value: number; count: number }) {
  if (!count) return <span className="muted small">No reviews yet</span>;
  return (
    <span className="stars small" aria-label={`Rated ${value} out of 5 from ${count} reviews`}>
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path d={PATH} fill="var(--marigold)" />
      </svg>
      <strong>{value.toFixed(1)}</strong>
      <span className="muted">
        ({count} review{count === 1 ? "" : "s"})
      </span>
    </span>
  );
}

/** 1–5 star picker that works with keyboard (radio group) and touch */
export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const labels = ["Poor", "Fair", "Good", "Very good", "Excellent"];
  const shown = hover || value;
  return (
    <div>
      <div role="radiogroup" aria-label="Rating" className="star-input" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}, ${labels[n - 1]}`}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d={PATH}
                fill={n <= shown ? "var(--marigold)" : "transparent"}
                stroke={n <= shown ? "var(--marigold)" : "#b9c6bf"}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ))}
      </div>
      <span className="muted small" aria-live="polite">
        {shown ? labels[shown - 1] : "Tap a star"}
      </span>
    </div>
  );
}
