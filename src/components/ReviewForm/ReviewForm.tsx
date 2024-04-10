//import { useEffect } from "react";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import FormGroup from "react-bootstrap/FormGroup";
import FormLabel from "react-bootstrap/FormLabel";
import FormControl from "react-bootstrap/FormControl";
import { Formik, Form, Field, FieldProps } from "formik";
import { Rating } from "react-simple-star-rating";
import { ChangeEvent } from "react";
import { useDispatch } from "react-redux";
import { addReview } from "../../redux/slice/reviews";

//import { useNavigate } from "react-router-dom";

//import { ReactNode } from "react";
interface Arg {
  doctorName: string;
}

function ReviewForm({ doctorName }: Arg) {
  const dispatch = useDispatch();

  interface valueType {
    name: string;

    review: string;
    rating: number;
  }
  const initialValues: valueType = {
    name: "",

    review: "",
    rating: 0,
  };

  //   useEffect(() => {
  //     if (sessionStorage.getItem("auth-token")) {
  //       navigate("/");
  //     }
  //   });
  //   const login = async (values: valueType) => {
  //     const res = await fetch(`${API_URL}/api/auth/login`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(values),
  //     });
  //     const json = await res.json();
  //     if (json.authtoken) {
  //       sessionStorage.setItem("auth-token", json.authtoken);

  //       //sessionStorage.setItem("email", values.email);
  //       navigate("/");
  //       window.location.reload();
  //     } else {
  //       if (json.errors) {
  //         for (const error of json.errors) {
  //           alert(error.msg);
  //         }
  //       } else {
  //         alert(json.error);
  //       }
  //     }
  //   };

  return (
    <Container fluid>
      <Row>
        <Col>
          <Formik
            // validationSchema={schema}
            onSubmit={(values: valueType) => {
              dispatch(
                addReview({
                  id: new Date().toDateString(),
                  author: values.name,
                  doctorName: doctorName,
                  comment: values.review,
                })
              );
            }}
            initialValues={initialValues}
          >
            {({ handleReset }) => {
              return (
                <Form>
                  <FormLabel className="fw-3 fs-3">Give Your Reviews</FormLabel>
                  <FormGroup className="mb-3" controlId="formBasicEmail">
                    <FormLabel className="fw-bold">Name:</FormLabel>
                    <Field
                      as={FormControl}
                      name="name"
                      type="text"
                      placeholder="Enter your name"
                      style={{ width: "100%" }}
                    />
                  </FormGroup>
                  <FormGroup className="mb-3" controlId="formBasicPassword">
                    <FormLabel className="fw-bold">Review:</FormLabel>
                    <Field>
                      {(field: FieldProps) => {
                        return (
                          <FormControl
                            placeholder="Write your review"
                            as="textarea"
                            rows={3}
                            style={{ width: "100%" }}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                              field.form.setFieldValue(
                                "review",
                                e.target.value
                              );
                            }}
                          />
                        );
                      }}
                    </Field>
                  </FormGroup>
                  <FormGroup className="mb-3" controlId="formBasicPassword">
                    <FormLabel className="fw-bold">Ratings:</FormLabel>
                    <Field name="rating">
                      {(field: FieldProps) => {
                        return (
                          <Rating
                            onClick={(e: number) =>
                              field.form.setFieldValue("rating", e)
                            }
                          />
                        );
                      }}
                    </Field>
                  </FormGroup>
                  <Button variant="primary" type="submit">
                    Submit
                  </Button>
                  <Button
                    variant="danger"
                    type="button"
                    onClick={() => handleReset()}
                  >
                    Reset
                  </Button>{" "}
                </Form>
              );
            }}
          </Formik>
        </Col>
      </Row>
    </Container>
  );
}

export default ReviewForm;
