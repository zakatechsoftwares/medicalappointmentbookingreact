import React, { useState } from "react";

interface Props {
  doctorName: string;
  doctorSpeciality: string;
  onSubmit: (data: {
    name: string;
    phoneNumber: string;
    doctorName: string;
    doctorSpeciality: string;

    dateOfAppointment: string;
    timeSlot: string;
  }) => void;
}

const AppointmentFormIC: React.FC<Props> = ({
  doctorName,
  doctorSpeciality,
  onSubmit,
}) => {
  const [name, setName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({
      name,
      phoneNumber,
      doctorName,
      doctorSpeciality,
      dateOfAppointment: `${new Date().getDate()}/${
        new Date().getMonth() + 1
      }/${new Date().getFullYear()}`,
      timeSlot: "9:00am",
    });
    setName("");
    setPhoneNumber("");
  };

  return (
    <form onSubmit={handleFormSubmit} className="appointment-form">
      <div className="form-group">
        <label htmlFor="name">Name:</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="phoneNumber">Phone Number:</label>
        <input
          type="tel"
          id="phoneNumber"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />
      </div>
      <button type="submit">Book Now</button>
    </form>
  );
};

export default AppointmentFormIC;
