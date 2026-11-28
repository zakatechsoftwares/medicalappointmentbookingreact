import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../Routes/AuthHook";
import { errorMessage } from "../../api";
import AuthLayout, { PasswordField, TextField } from "../Auth/AuthLayout";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();
  const redirectTo = (location.state as { from?: string } | null)?.from || "/instant-consultation";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [user, navigate, redirectTo]);

  const emailError = !EMAIL_RE.test(email.trim()) ? "Enter the email you signed up with" : "";
  const passwordError = !password ? "Enter your password" : "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (emailError || passwordError) return;
    setBusy(true);
    setError("");
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Log in"
      intro={
        (location.state as { from?: string } | null)?.from
          ? "Log in to finish booking your appointment."
          : "Welcome back. Log in to book and manage your visits."
      }
    >
      <form onSubmit={submit} noValidate>
        {error && (
          <div className="notice notice-error" role="alert">
            {error}
          </div>
        )}
        <TextField
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={setEmail}
          error={touched ? emailError : ""}
        />
        <PasswordField
          id="login-password"
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          error={touched ? passwordError : ""}
        />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="auth-switch">
        No account yet?{" "}
        <Link to="/sign_up" state={location.state}>
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}

export default Login;
