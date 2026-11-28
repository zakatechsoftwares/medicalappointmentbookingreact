import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { DailyCall } from "@daily-co/daily-js";
import { ApiError, errorMessage } from "../../api";
import { VideoJoinResponse } from "../../redux/DataType/DataType";
import "./Video.css";

interface Props {
  /** Asks our server for a room link and a personal token */
  requestJoin: (consent: boolean) => Promise<VideoJoinResponse>;
  needsConsent: boolean;
  /** ISO time the room opens; before that the join button waits */
  opensAt?: string;
  backTo: { href: string; label: string };
  /** Shown above the join button */
  children?: React.ReactNode;
}

type Phase = "ready" | "joining" | "in-call" | "ended";

const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });

/**
 * Pre-call checklist and consent, then Daily's ready-made call screen inside the page.
 * The call itself runs on Daily's servers; nothing is recorded.
 */
export default function VideoRoom({ requestJoin, needsConsent, opensAt, backTo, children }: Props) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const frameHost = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);

  // Tick so the button switches on by itself when the room opens
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  // Leave the call if the person navigates away
  useEffect(() => () => void callRef.current?.destroy(), []);

  const opensAtMs = opensAt ? Date.parse(opensAt) : 0;
  const tooEarly = opensAtMs > now;

  const join = async () => {
    setError("");
    setPhase("joining");
    try {
      const { roomUrl, token } = await requestJoin(consent);
      // Loaded only here, so people who never make a video call don't download it
      const { default: DailyIframe } = await import("@daily-co/daily-js");
      if (!frameHost.current) return;
      const call = DailyIframe.createFrame(frameHost.current, {
        showLeaveButton: true,
        showFullscreenButton: true,
        iframeStyle: { width: "100%", height: "100%", border: "0" },
      });
      callRef.current = call;
      call.on("left-meeting", () => {
        call.destroy();
        callRef.current = null;
        setPhase("ended");
      });
      call.on("error", (e) => setError(e?.errorMsg || "The call ran into a problem. Try joining again."));
      setPhase("in-call");
      await call.join({ url: roomUrl, token });
    } catch (e) {
      callRef.current?.destroy();
      callRef.current = null;
      setPhase("ready");
      setError(e instanceof ApiError || e instanceof Error ? errorMessage(e) : "Couldn't start the call");
    }
  };

  if (phase === "ended") {
    return (
      <div className="panel empty">
        <h2>Call ended</h2>
        <p>If you were cut off, you can join again while the appointment time lasts.</p>
        <div className="booking-done-links" style={{ justifyContent: "center" }}>
          <button type="button" className="btn btn-primary" onClick={() => setPhase("ready")}>
            Rejoin
          </button>
          <Link to={backTo.href} className="btn btn-quiet">
            {backTo.label}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`video-stage ${phase === "in-call" ? "is-live" : ""}`} ref={frameHost} />

      {phase !== "in-call" && (
        <div className="panel panel-pad video-prejoin">
          {children}
          {error && (
            <div className="notice notice-error" role="alert">
              {error}
            </div>
          )}
          <h2>Before you join</h2>
          <ul className="video-checklist">
            <li>Find a quiet, private place where you can talk freely.</li>
            <li>Sit facing a window or lamp so the doctor can see you clearly.</li>
            <li>Use Wi-Fi or a strong data signal, and charge your phone.</li>
            <li>Keep your medicines, test results or scan reports close by.</li>
          </ul>

          {needsConsent && (
            <label className="video-consent">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>
                I agree to see the doctor by video. The call is private and isn't recorded. The
                doctor may ask me to come to the clinic if an examination is needed.
              </span>
            </label>
          )}

          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={phase === "joining" || tooEarly || (needsConsent && !consent)}
            onClick={join}
          >
            {phase === "joining"
              ? "Connecting…"
              : tooEarly
                ? `The room opens at ${timeFmt.format(opensAtMs)}`
                : "Join video call"}
          </button>
          <p className="muted small" style={{ marginTop: "var(--space-3)" }}>
            Your browser will ask to use your camera and microphone. Choose “Allow”.
          </p>
        </div>
      )}
    </>
  );
}
