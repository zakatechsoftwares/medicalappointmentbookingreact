import { useState } from "react";
import { Link } from "react-router-dom";
import "./Auth.css";

/** Shared frame for log in and sign up: form on the left, a short reassurance on the right. */
export default function AuthLayout({
  title,
  intro,
  children,
}: {
  title: string;
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="page auth">
      <div className="auth-form panel panel-pad">
        <h1>{title}</h1>
        <p className="muted">{intro}</p>
        {children}
      </div>
      <aside className="auth-aside">
        <h2>Your visits, in one place</h2>
        <ul>
          <li>See which times are free before you leave home.</li>
          <li>Get a clinic card on your phone for every booking.</li>
          <li>Cancel in two taps if your plans change.</li>
        </ul>
        <p className="small">
          New here? <Link to="/instant-consultation">Browse doctors</Link> without an account.
        </p>
      </aside>
    </div>
  );
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  error,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  error?: string;
  hint?: string;
}) {
  const [shown, setShown] = useStateToggle();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && <span className="hint">{hint}</span>}
      <div className="password-wrap">
        <input
          id={id}
          className="input"
          type={shown ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
        />
        <button type="button" className="password-toggle" onClick={setShown} aria-pressed={shown}>
          {shown ? "Hide" : "Show"}
        </button>
      </div>
      {error && (
        <span className="field-error" id={`${id}-err`}>
          {error}
        </span>
      )}
    </div>
  );
}

function useStateToggle(): [boolean, () => void] {
  const [v, setV] = useState(false);
  return [v, () => setV((x) => !x)];
}

export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  ...rest
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && <span className="hint">{hint}</span>}
      <input
        id={id}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        {...rest}
      />
      {error && (
        <span className="field-error" id={`${id}-err`}>
          {error}
        </span>
      )}
    </div>
  );
}
