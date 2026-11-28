import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p>
          In an emergency, don't book online. Go to the nearest hospital emergency unit or call
          112.
        </p>
        <nav aria-label="Footer">
          <Link to="/instant-consultation">Find a doctor</Link>
          <Link to="/appointments">My appointments</Link>
        </nav>
        <p className="small muted">StayHealthy by Zakatech Software Enterprise</p>
      </div>
    </footer>
  );
}
