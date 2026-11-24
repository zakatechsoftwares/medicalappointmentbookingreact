import Container from "react-bootstrap/Container";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import { Link, useNavigate } from "react-router-dom";
import { PDFDownloadLink } from "@react-pdf/renderer";
import PdfDownload from "./ReportPdfDownload";
import { useAuth } from "../Routes/AuthHook";
import { useAppSelector } from "../../redux/store";

/** One report per doctor the patient has an appointment with. */
function ReportsLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const bookings = useAppSelector((s) => s.booking.bookings);

  // Unique doctors from the patient's (non-cancelled) appointments
  const doctors = Array.from(
    new Map(
      bookings
        .filter((b) => b.status !== "cancelled")
        .map((b) => [b.doctorId, { id: b.doctorId, name: b.doctorName, speciality: b.doctorSpeciality }])
    ).values()
  );

  if (!user) return null;

  if (doctors.length === 0) {
    return (
      <Container className="py-4">
        <p className="fw-bold fs-3">Reports</p>
        <p className="text-muted">
          Reports appear here after you book an appointment.{" "}
          <Link to="/instant-consultation">Find a doctor</Link>
        </p>
      </Container>
    );
  }

  return (
    <Container fluid>
      <p className="align-text-center fw-bold fs-3">Reports</p>
      <Table>
        <thead>
          <tr>
            <th style={{ width: "5%" }}>Serial number</th>
            <th style={{ width: "20%" }}>Doctor's Name</th>
            <th style={{ width: "10%" }}> Speciality</th>
            <th style={{ width: "40%" }}>View Report</th>
            <th style={{ width: "33%" }}>Download Report</th>
          </tr>
        </thead>
        <tbody>
          {doctors.map((doctor, index) => (
            <tr key={doctor.id}>
              <td>{index + 1}</td>
              <td>{doctor.name}</td>
              <td> {doctor.speciality}</td>
              <td>
                <Button
                  className="w-50 mt-1"
                  onClick={() =>
                    navigate("/reportdisplay", {
                      state: {
                        doctorName: doctor.name,
                        speciality: doctor.speciality,
                        phoneNumber: user.phone,
                        email: user.email,
                        name: user.name,
                      },
                    })
                  }
                >
                  View Report
                </Button>
              </td>

              <td>
                <PDFDownloadLink
                  document={
                    <PdfDownload
                      doctorName={doctor.name}
                      speciality={doctor.speciality}
                      phoneNumber={user.phone}
                      email={user.email}
                      name={user.name}
                    />
                  }
                  fileName={`report_${doctor.name.replace(/[^a-z0-9]+/gi, "_")}.pdf`}
                  className="btn text-bg-primary w-75 mt-1"
                >
                  {({ loading }) =>
                    loading ? "Loading document..." : "Download report"
                  }
                </PDFDownloadLink>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}

export default ReportsLayout;
