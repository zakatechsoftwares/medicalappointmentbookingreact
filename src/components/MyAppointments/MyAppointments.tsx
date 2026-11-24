import { useState } from "react";
import Container from "react-bootstrap/Container";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/store";
import { cancelAppointment, fetchAppointments } from "../../redux/slice/bookingSlice";
import { formatDate, formatTime } from "../../utils/format";
import { BookingType } from "../../redux/DataType/DataType";

const STATUS_VARIANT: Record<BookingType["status"], string> = {
  booked: "primary",
  cancelled: "secondary",
  completed: "success",
};

function MyAppointments() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { bookings, status, error } = useAppSelector((s) => s.booking);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const handleCancel = async (id: string) => {
    if (!window.confirm("Cancel this appointment?")) return;
    setBusyId(id);
    setActionError("");
    try {
      await dispatch(cancelAppointment(id)).unwrap();
    } catch (e) {
      setActionError(String(e));
    } finally {
      setBusyId(null);
    }
  };

  const upcoming = bookings.filter((b) => b.status === "booked");
  const past = bookings.filter((b) => b.status !== "booked").reverse();

  const renderTable = (list: BookingType[], allowCancel: boolean) => (
    <Table responsive hover>
      <thead>
        <tr>
          <th>Date</th>
          <th>Time</th>
          <th>Doctor</th>
          <th>Speciality</th>
          <th>Patient</th>
          <th>Status</th>
          {allowCancel && <th></th>}
        </tr>
      </thead>
      <tbody>
        {list.map((b) => (
          <tr key={b.id}>
            <td>{formatDate(b.date)}</td>
            <td>{formatTime(b.timeSlot)}</td>
            <td>{b.doctorName}</td>
            <td>{b.doctorSpeciality}</td>
            <td>{b.patientName}</td>
            <td>
              <Badge bg={STATUS_VARIANT[b.status]}>{b.status}</Badge>
            </td>
            {allowCancel && (
              <td>
                <Button
                  size="sm"
                  variant="outline-danger"
                  disabled={busyId === b.id}
                  onClick={() => handleCancel(b.id)}
                >
                  {busyId === b.id ? "Cancelling..." : "Cancel"}
                </Button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  );

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="m-0">My Appointments</h2>
        <Button onClick={() => navigate("/instant-consultation")}>Book new</Button>
      </div>

      {status === "loading" && <Spinner animation="border" />}
      {status === "error" && (
        <Alert variant="danger">
          {error}{" "}
          <Button size="sm" variant="link" onClick={() => dispatch(fetchAppointments())}>
            Try again
          </Button>
        </Alert>
      )}
      {actionError && <Alert variant="danger">{actionError}</Alert>}

      {status === "ready" && (
        <>
          <h5>Upcoming</h5>
          {upcoming.length ? (
            renderTable(upcoming, true)
          ) : (
            <p className="text-muted">
              No upcoming appointments. <Link to="/instant-consultation">Find a doctor</Link>
            </p>
          )}
          {past.length > 0 && (
            <>
              <h5 className="mt-4">Past and cancelled</h5>
              {renderTable(past, false)}
            </>
          )}
        </>
      )}
    </Container>
  );
}

export default MyAppointments;
