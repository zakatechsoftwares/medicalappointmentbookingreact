import { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Spinner from "react-bootstrap/Spinner";
import { useAuth } from "./AuthHook";

/** Shows its children only to logged-in users; everyone else goes to /login and comes back after. */
export default function ProtectedRoute({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center p-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}
