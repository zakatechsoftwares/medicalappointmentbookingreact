import { Link, useNavigate } from "react-router-dom";
import { PDFDownloadLink } from "@react-pdf/renderer";
import PdfDownload from "./ReportPdfDownload";
import { useAuth } from "../Routes/AuthHook";
import { useAppSelector } from "../../redux/store";
import DoctorAvatar from "../../ui/DoctorAvatar";

/** One report per doctor the patient has an appointment with. */
function ReportsLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const bookings = useAppSelector((s) => s.booking.bookings);

  const doctors = Array.from(
    new Map(
      bookings
        .filter((b) => b.status !== "cancelled")
        .map((b) => [b.doctorId, { id: b.doctorId, name: b.doctorName, speciality: b.doctorSpeciality }])
    ).values()
  );

  if (!user) return null;

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <h1>Reports</h1>
        <p>Medical reports from your doctors. Open one to read it, or save a PDF copy.</p>
      </div>

      {doctors.length === 0 ? (
        <div className="panel empty">
          <h2>No reports yet</h2>
          <p>Reports appear here after you've booked a visit.</p>
          <Link to="/instant-consultation" className="btn btn-primary">
            Find a doctor
          </Link>
        </div>
      ) : (
        <ul className="list panel">
          {doctors.map((doctor) => {
            const report = {
              doctorName: doctor.name,
              speciality: doctor.speciality,
              phoneNumber: user.phone,
              email: user.email,
              name: user.name,
            };
            return (
              <li key={doctor.id} className="review-row">
                <DoctorAvatar name={doctor.name} speciality={doctor.speciality} />
                <div>
                  <strong>{doctor.name}</strong>
                  <p className="muted small">{doctor.speciality}</p>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", gridColumn: "2 / -1" }}>
                  <button type="button" className="btn btn-quiet btn-sm" onClick={() => navigate("/reportdisplay", { state: report })}>
                    Open report
                  </button>
                  <PDFDownloadLink
                    document={<PdfDownload {...report} />}
                    fileName={`report_${doctor.name.replace(/[^a-z0-9]+/gi, "_")}.pdf`}
                    className="btn btn-primary btn-sm"
                  >
                    {({ loading }) => (loading ? "Preparing PDF…" : "Download PDF")}
                  </PDFDownloadLink>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default ReportsLayout;
