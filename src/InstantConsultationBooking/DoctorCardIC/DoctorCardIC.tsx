import React, { useState } from "react";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import "./DoctorCardIC.css";
import { useNavigate } from "react-router-dom";
import AppointmentFormIC from "../AppointmentFormIC/AppointmentFormIC";
import { formatDate, formatTime } from "../../utils/format";
import { useAppDispatch, useAppSelector } from "../../redux/store";
import { bookAppointment, cancelAppointment } from "../../redux/slice/bookingSlice";
import { useAuth } from "../../components/Routes/AuthHook";
import { DoctorType, NewBookingType, isActiveBooking } from "../../redux/DataType/DataType";

const PersonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="46"
    height="46"
    fill="currentColor"
    className="bi bi-person-fill"
    viewBox="0 0 16 16"
  >
    <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
  </svg>
);

const DoctorCardIC: React.FC<{ doctor: DoctorType }> = ({ doctor }) => {
  const [showModal, setShowModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();

  // The patient's upcoming booking with this doctor, if any (comes from the server)
  const booking = useAppSelector((state) =>
    state.booking.bookings.find((b) => b.doctorId === doctor.id && isActiveBooking(b))
  );

  const handleBook = async (data: NewBookingType) => {
    // unwrap() throws the server's error message so the form can show it
    await dispatch(bookAppointment(data)).unwrap();
  };

  const handleCancel = async () => {
    if (!booking) return;
    setCancelling(true);
    setCancelError("");
    try {
      await dispatch(cancelAppointment(booking.id)).unwrap();
      setShowModal(false);
    } catch (e) {
      setCancelError(String(e));
    } finally {
      setCancelling(false);
    }
  };

  const openModal = () => {
    if (!user) {
      navigate("/login", { state: { from: `/instant-consultation?speciality=${doctor.speciality}` } });
      return;
    }
    setShowModal(true);
  };

  const details = (
    <div className="doctor-card-details">
      <div className="doctor-card-detail-name">{doctor.name}</div>
      <div className="doctor-card-detail-speciality">{doctor.speciality}</div>
      <div className="doctor-card-detail-experience">{doctor.experience} years experience</div>
      <div className="doctor-card-detail-consultationfees">
        {doctor.ratingCount > 0
          ? `★ ${doctor.ratings} (${doctor.ratingCount} review${doctor.ratingCount > 1 ? "s" : ""})`
          : "No reviews yet"}
      </div>
    </div>
  );

  return (
    <div className="doctor-card-container">
      <div className="doctor-card-details-container">
        <div className="doctor-card-profile-image-container">
          <PersonIcon />
        </div>
        {details}
      </div>

      <div className="doctor-card-options-container">
        <button
          className={`book-appointment-btn ${booking ? "cancel-appointment" : ""}`}
          onClick={openModal}
        >
          <div>{booking ? "View / Cancel Appointment" : "Book Appointment"}</div>
          <div>
            {doctor.consultationFee > 0
              ? `₦${doctor.consultationFee.toLocaleString()} consultation`
              : "No Booking Fee"}
          </div>
        </button>
        <Popup modal open={showModal} onClose={() => setShowModal(false)}>
          <div className="doctorbg" style={{ maxHeight: "90vh", overflowY: "auto", padding: 16 }}>
            <div className="d-flex gap-3 align-items-center mb-3">
              <div className="doctor-card-profile-image-container">
                <PersonIcon />
              </div>
              {details}
            </div>

            {booking ? (
              <>
                <h3 style={{ textAlign: "center" }}>
                  {booking.status === "confirmed" ? "Appointment Confirmed!" : "Appointment Booked!"}
                </h3>
                {booking.status === "pending" && (
                  <p className="text-center text-muted small">
                    The clinic will confirm your appointment shortly.
                  </p>
                )}
                <div className="bookedInfo">
                  <p>Patient: {booking.patientName}</p>
                  <p>Phone Number: {booking.phoneNumber}</p>
                  <p>Reason: {booking.reason}</p>
                  <p>
                    Date: {formatDate(booking.date)} at{" "}
                    {formatTime(booking.timeSlot)}
                  </p>
                  {cancelError && <p className="text-danger">{cancelError}</p>}
                  <button onClick={handleCancel} disabled={cancelling}>
                    {cancelling ? "Cancelling..." : "Cancel Appointment"}
                  </button>
                </div>
              </>
            ) : (
              <AppointmentFormIC doctor={doctor} onSubmit={handleBook} />
            )}
          </div>
        </Popup>
      </div>
    </div>
  );
};

export default DoctorCardIC;
