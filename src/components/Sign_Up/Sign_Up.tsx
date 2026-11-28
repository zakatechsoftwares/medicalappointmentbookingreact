import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../Routes/AuthHook";
import { errorMessage } from "../../api";
import AuthLayout, { PasswordField, TextField } from "../Auth/AuthLayout";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+234\d{10}|0\d{10})$/;

function Sign_Up() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, register } = useAuth();
  const redirectTo = (location.state as { from?: string } | null)?.from || "/instant-consultation";

  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [user, navigate, redirectTo]);

  const errors = {
    name: form.name.trim().length < 4 ? "Enter your full name (at least 4 letters)" : "",
    phone: !PHONE_RE.test(form.phone.trim()) ? "Enter a Nigerian number, like 08012345678" : "",
    email: !EMAIL_RE.test(form.email.trim()) ? "Enter a valid email address" : "",
    password: form.password.length < 8 ? "Use at least 8 characters" : "",
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (Object.values(errors).some(Boolean)) return;
    setBusy(true);
    setError("");
    try {
      await register({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
      });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const show = (k: keyof typeof errors) => (touched ? errors[k] : "");

  return (
    <AuthLayout title="Create your account" intro="It takes a minute. You'll use it to book and manage visits.">
      <form onSubmit={submit} noValidate>
        {error && (
          <div className="notice notice-error" role="alert">
            {error}
          </div>
        )}
        <TextField id="su-name" label="Full name" autoComplete="name" value={form.name} onChange={set("name")} error={show("name")} />
        <TextField
          id="su-phone"
          label="Phone number"
          hint="The clinic uses this to reach you about your visits."
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="08012345678"
          value={form.phone}
          onChange={set("phone")}
          error={show("phone")}
        />
        <TextField
          id="su-email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={form.email}
          onChange={set("email")}
          error={show("email")}
        />
        <PasswordField
          id="su-password"
          label="Password"
          hint="At least 8 characters."
          autoComplete="new-password"
          value={form.password}
          onChange={set("password")}
          error={show("password")}
        />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account?{" "}
        <Link to="/login" state={location.state}>
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default Sign_Up;
