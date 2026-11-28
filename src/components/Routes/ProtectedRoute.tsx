import { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthHook";

/** Shows its children only to logged-in users; everyone else goes to /login and comes back after. */
export default function ProtectedRoute({
  children,
  staffOnly = false,
}: PropsWithChildren<{ staffOnly?: boolean }>) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="spinner" role="status" aria-label="Loading" />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  // UX only: the server checks the role on every clinic request
  if (staffOnly && user.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}
