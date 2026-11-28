import { useState } from "react";
import { useAuth } from "../Routes/AuthHook";
import { errorMessage } from "../../api";
import { TextField } from "../Auth/AuthLayout";

const PHONE_RE = /^(\+234\d{10}|0\d{10})$/;

/** The patient's own details. Email can't be changed here because it's the login. */
function ProfileCard() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const nameError = name.trim().length < 4 ? "Enter your full name (at least 4 letters)" : "";
  const phoneError = !PHONE_RE.test(phone.trim()) ? "Enter a Nigerian number, like 08012345678" : "";
  const changed = name.trim() !== user.name || phone.trim() !== user.phone;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setSaved(false);
    if (nameError || phoneError) return;
    setBusy(true);
    setError("");
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim() });
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <h1>Your details</h1>
        <p>These fill in automatically when you book.</p>
      </div>
      <form className="panel panel-pad" onSubmit={submit} noValidate style={{ maxWidth: "34rem" }}>
        {error && (
          <div className="notice notice-error" role="alert">
            {error}
          </div>
        )}
        {saved && (
          <div className="notice notice-success" role="status">
            Details saved.
          </div>
        )}
        <TextField id="pf-name" label="Full name" autoComplete="name" value={name} onChange={setName} error={touched ? nameError : ""} />
        <TextField
          id="pf-phone"
          label="Phone number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={setPhone}
          error={touched ? phoneError : ""}
        />
        <div className="field">
          <label htmlFor="pf-email">Email</label>
          <span className="hint">You log in with this, so it can't be changed here.</span>
          <input id="pf-email" className="input" value={user.email} readOnly disabled />
        </div>
        <button type="submit" className="btn btn-primary" disabled={busy || !changed}>
          {busy ? "Saving…" : "Save details"}
        </button>
      </form>
    </div>
  );
}

export default ProfileCard;
