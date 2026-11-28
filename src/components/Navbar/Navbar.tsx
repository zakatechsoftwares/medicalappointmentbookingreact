import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../Routes/AuthHook";
import "./Navbar.css";

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="StayHealthy home">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="var(--leaf)" />
        <path d="M13 7h6v6h6v6h-6v6h-6v-6H7v-6h6z" fill="var(--paper)" />
        <circle cx="24" cy="8" r="3" fill="var(--marigold)" />
      </svg>
      <span>StayHealthy</span>
    </Link>
  );
}

function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the page changes
  useEffect(() => setOpen(false), [pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Logo />

        <button
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="visually-hidden">Menu</span>
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            )}
          </svg>
        </button>

        <nav id="site-nav" className={`site-nav ${open ? "is-open" : ""}`} aria-label="Main">
          <NavLink to="/instant-consultation">Find a doctor</NavLink>
          {user && (
            <>
              <NavLink to="/appointments">My appointments</NavLink>
              <NavLink to="/reviews">Reviews</NavLink>
              <NavLink to="/reportlayout">Reports</NavLink>
              {user.role === "admin" && <NavLink to="/clinic">Clinic desk</NavLink>}
            </>
          )}
          <span className="site-nav-spacer" />
          {user ? (
            <>
              <NavLink to="/profile" className="site-nav-account">
                <span className="site-nav-initial" aria-hidden="true">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                {user.name.split(" ")[0]}
              </NavLink>
              <button type="button" className="btn btn-quiet btn-sm" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <Link to="/sign_up" className="btn btn-primary btn-sm">
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default AppNavbar;
