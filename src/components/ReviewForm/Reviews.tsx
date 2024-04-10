import Container from "react-bootstrap/Container";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import { useState, useEffect } from "react";
import Popup from "reactjs-popup";
import ReviewForm from "./ReviewForm";
import { useSelector } from "react-redux";
import { DoctorReviewType, DoctorType } from "../../redux/DataType/DataType";
import { ReduxStoreStateType } from "../../redux/DataType/DataType";

function Reviews() {
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
      <p className="align-text-center fw-bold fs-3">Reviews</p>
      <Table>
        <thead>
          <tr>
            <th style={{ width: "20%" }}>Serial number</th>
            <th style={{ width: "20%" }}>Doctor's Name</th>
            <th style={{ width: "10%" }}>Speciality</th>
            <th style={{ width: "20%" }}>Provide feedback</th>
            <th style={{ width: "30%" }}>Review Given</th>
          </tr>
        </thead>
        <tbody>
          {doctors.map((doctor: DoctorType, index) => (
            <tr key={doctor.name}>
              <td>{index + 1}</td>
              <td>{doctor.name}</td>
              <td> {doctor.speciality}</td>
              <td>
                <Popup
                  trigger={<Button style={{ width: "50%" }}>Review</Button>}
                  modal
                  open={open}
                  onClose={() => setOpen(false)}
                >
                  <ReviewForm doctorName={doctor.name} />
                </Popup>
              </td>

              <td>
                {/* {reviews.reviews.length || <p>No reviews found</p>}
                {reviews.reviews.length &&
                  "THIS IS IT" &&
                  reviews.reviews.map((doctorReview: DoctorReviewType) => {
                    console.log("Checking doctor review:", doctorReview);
                    console.log("Doctor name:", doctor.name);
                    if (doctorReview.name === doctor.name) {
                      console.log("Matching doctor found:", doctorReview.name);
                      return (
                        <div key={doctorReview.name}>
                          {doctorReview.review.map((comment, commentIndex) => {
                            console.log("Comment:", comment.comment);
                            return (
                              <p key={commentIndex}>
                                This is the coment{comment.comment}
                              </p>
                            );
                          })}
                        </div>
                      );
                    }
                    return null;
                  })} */}

                {reviews.reviews.length > 0 &&
                  reviews.reviews.map((doctorReview: DoctorReviewType) => {
                    if (doctorReview.name === doctor.name) {
                      return (
                        <div key={doctorReview.name}>
                          {doctorReview.review.map((comment, commentIndex) => {
                            return (
                              <span key={commentIndex}>
                                {" "}
                                <strong>{comment.author}:</strong>{" "}
                                {comment.comment} <br />
                              </span>
                            );
                          })}
                        </div>
                      );
                    } else {
                      return <>No review yet</>;
                    }
                  })}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}

export default Reviews;
