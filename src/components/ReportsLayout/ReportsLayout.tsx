import Container from "react-bootstrap/Container";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import { useState, useEffect } from "react";
import Popup from "reactjs-popup";
import ReviewForm from "./ReviewForm";
import { useSelector } from "react-redux";
import { DoctorReviewType, DoctorType } from "../../redux/DataType/DataType";
import { ReduxStoreStateType } from "../../redux/DataType/DataType";

function ReportsLayout() {
  const [doctors, setDoctors] = useState<DoctorType[]>([]);
  const [open, setOpen] = useState(false);
  const reviews = useSelector((state: ReduxStoreStateType) => state.reviews);
  //console.log(reviews.reviews);

  const getDoctorsDetails = () => {
    fetch("https://api.npoint.io/9a5543d36f1460da2f63")
      .then((res) => res.json())
      .then((data) => {
        setDoctors(data);
      })
      .catch((err) => console.log(err));
  };

  useEffect(
    () => {
      getDoctorsDetails();
      // const authtoken = sessionStorage.getItem("auth-token");
      // if (!authtoken) {
      //     navigate("/login");
      // }
    } //, [searchParams]
  );

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
          {doctors.map((doctor: DoctorType, index) => (
            <tr key={doctor.name}>
              <td>{index + 1}</td>
              <td>{doctor.name}</td>
              <td> {doctor.speciality}</td>
              <td>
                <Button style={{ width: "100%" }}>View Report</Button>
              </td>

              <td>
                <Button style={{ width: "100%" }}>Download Report</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}

export default ReportsLayout;
