import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../redux/store";
import { useAuth } from "../../components/Routes/AuthHook";
import { DoctorType, isActiveBooking } from "../../redux/DataType/DataType";
import DoctorAvatar from "../../ui/DoctorAvatar";
import { StarRating } from "../../ui/Stars";
import Sheet from "../../ui/Sheet";
import BookingFlow from "../AppointmentFormIC/AppointmentFormIC";
import { formatDate, formatFee, formatTime, formatWorkingDays } from "../../utils/format";

/** One doctor in the results list, with the booking sheet behind the button. */
const DoctorCardIC: React.FC<{ doctor: DoctorType }> = ({ doctor }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const booking = useAppSelector((state) =>
    state.booking.bookings.find((b) => b.doctorId === doctor.id && isActiveBooking(b))
  );

  const startBooking = () => {
    if (!user) {
      navigate("/login", {
        state: { from: `/instant-consultation?speciality=${encodeURIComponent(doctor.speciality)}` },
      });
      return;
    }
    setOpen(true);
  };

  return (
    <div className="doctor-row">
      <DoctorAvatar name={doctor.name} speciality={doctor.speciality} />
      <div>
        <h2>{doctor.name}</h2>
        <p className="doctor-row-spec">{doctor.speciality}</p>
        <ul className="doctor-row-facts">
          <li>
            <StarRating value={doctor.ratings} count={doctor.ratingCount} />
          </li>
          <li>{doctor.experience} years' experience</li>
          <li>Consults {formatWorkingDays(doctor.workingDays)}</li>
          <li>
            <strong>{doctor.consultationFee > 0 ? formatFee(doctor.consultationFee) : "Free"}</strong>{" "}
            consultation
          </li>
        </ul>
      </div>

      <div className="doctor-row-action">
        {booking ? (
          <>
            <span className="doctor-row-booked">
              Booked for {formatDate(booking.date)}, {formatTime(booking.timeSlot)}
            </span>
            <Link to="/appointments" className="btn btn-quiet">
              View booking
            </Link>
          </>
        ) : (
          <button type="button" className="btn btn-primary" onClick={startBooking}>
            {user ? "Book appointment" : "Log in to book"}
          </button>
        )}
      </div>

      <Sheet open={open} title="Book an appointment" onClose={() => setOpen(false)}>
        <BookingFlow doctor={doctor} onClose={() => setOpen(false)} />
      </Sheet>
    </div>
  );
};

export default DoctorCardIC;
