import { Container } from "react-bootstrap";
import Accordion from "react-bootstrap/Accordion";
import { useSelector } from "react-redux";

interface BookingType {
  id: string;
  name: string;
  phoneNumber: string;
  doctorName: string;
  doctorSpeciality: string;
  dateOfAppointment: string;
  timeSlot: string;
}
interface Booking {
  booking: { bookings: BookingType[] };
}
const Notification = () => {
  const bookings = useSelector((state: Booking) => state.booking.bookings);
  return (
    <Container fluid className="position-fixed top-5 pt-5">
      {bookings.length > 0 &&
        bookings.map((booking, index) => (
          <Accordion defaultActiveKey="0" className="z-5" key={index}>
            <Accordion.Item eventKey="0">
              <Accordion.Header>
                Appointment Details {bookings.length > 1 && index + 1}
              </Accordion.Header>
              <Accordion.Body>
                <strong>Doctor:</strong> {booking.doctorName} <br />
                <strong>Speciality:</strong> {booking.doctorSpeciality} <br />
                <strong>Name:</strong> {booking.name} <br />
                <strong>Phone number:</strong> {booking.phoneNumber} <br />
                <strong>Date of Appointment:</strong>{" "}
                {booking.dateOfAppointment} <br />
                <strong>Time Slot:</strong> {booking.timeSlot} <br />
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        ))}
    </Container>
  );
};

export default Notification;
