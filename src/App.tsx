import { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import AuthProvider from "./components/Routes/AuthProvider.tsx";
import ProtectedRoute from "./components/Routes/ProtectedRoute.tsx";
import Layout from "./components/Layout/Layout.tsx";
import LandingPag from "./components/Landing_Page/LandingPag.tsx";
import Login from "./components/Login/Login.tsx";
import Sign_Up from "./components/Sign_Up/Sign_Up.tsx";
import InstantConsultation from "./InstantConsultationBooking/InstantConsultation.tsx";
import MyAppointments from "./components/MyAppointments/MyAppointments.tsx";
import Reviews from "./components/ReviewForm/Reviews.tsx";
// The PDF library is large, so the report pages load only when opened
const ReportsLayout = lazy(
  () => import("./components/ReportsLayout/ReportsLayout.tsx"),
);
const PdfDisplay = lazy(
  () => import("./components/ReportsLayout/ReportPdfDisplay.tsx"),
);

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<div className="p-5 text-center">Loading...</div>}>
          <Routes>
            <Route path="/" element={<LandingPag />} />
            <Route element={<Layout />}>
              {/* Anyone can browse doctors; booking asks them to log in */}
              <Route
                path="/instant-consultation"
                element={<InstantConsultation />}
              />
              <Route path="/login" element={<Login />} />
              <Route path="/sign_up" element={<Sign_Up />} />
              <Route
                path="/appointments"
                element={
                  <ProtectedRoute>
                    <MyAppointments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reviews"
                element={
                  <ProtectedRoute>
                    <Reviews />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reportlayout"
                element={
                  <ProtectedRoute>
                    <ReportsLayout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reportdisplay"
                element={
                  <ProtectedRoute>
                    <PdfDisplay />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}
