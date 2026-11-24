import { useState } from "react";
import Alert from "react-bootstrap/Alert";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import FormGroup from "react-bootstrap/FormGroup";
import FormLabel from "react-bootstrap/FormLabel";
import FormControl from "react-bootstrap/FormControl";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as yup from "yup";

import { useAuth } from "../Routes/AuthHook";
import { errorMessage } from "../../api";

function ProfileCard({ onDone }: { onDone?: () => void }) {
  const { user: userDetails, updateProfile } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const schema = yup.object().shape({
    name: yup
      .string()
      .required()
      .min(4, "String must be at least 4 characters"),
    email: yup
      .string()

      .email()
      .required(),

    phone: yup
      .string()
      .required()
      .matches(/^(\+234\d{10}|0\d{10})$/, "Enter a valid Nigerian phone number, e.g. 08012345678"),
  });
  interface valueType {
    name: string;
    email: string;
    phone: string;
  }
  const initialValues: valueType = {
    name: userDetails?.name || "",
    email: userDetails?.email || "",
    phone: userDetails?.phone || "",
  };
  const handleEdit = () => {
    setSaved(false);
    setEditMode(!editMode);
  };

  const handleSubmit = async (values: valueType) => {
    setError("");
    try {
      await updateProfile({ name: values.name, phone: values.phone });
      setEditMode(false);
      setSaved(true);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  if (!userDetails) return null;

  return (
    <Container fluid>
      <Row>
        <Col>
          <div className="signup-grid">
            <div className="signup-text">
              <h1>Profile</h1>
            </div>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}
          {saved && <Alert variant="success">Profile updated successfully</Alert>}
          {editMode ? (
            <Formik
              validationSchema={schema}
              onSubmit={handleSubmit}
              initialValues={initialValues}
              enableReinitialize
            >
              {() => {
                return (
                  <Form>
                    <FormLabel>Edit profile</FormLabel>
                    <FormGroup className="mb-3" controlId="formBasicName">
                      <FormLabel className="fw-bold">Name</FormLabel>
                      <Field
                        as={FormControl}
                        type="text"
                        placeholder="Enter your name"
                        style={{ width: "100%" }}
                        name="name"
                        // onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        //   formik.setFieldValue("name", e.target.value);
                        // }}
                      />
                      <ErrorMessage name="name" />
                    </FormGroup>
                    <FormGroup className="mb-3" controlId="formBasicPhone">
                      <FormLabel className="fw-bold">Phone number</FormLabel>
                      <Field
                        as={FormControl}
                        name="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        style={{ width: "100%" }}
                      />
                      <ErrorMessage name="phone" />
                    </FormGroup>
                    <FormGroup className="mb-3" controlId="formBasicEmail">
                      <FormLabel className="fw-bold">Email address</FormLabel>
                      <Field
                        disabled
                        as={FormControl}
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        style={{ width: "100%" }}
                      />
                      <ErrorMessage name="email" />
                    </FormGroup>

                    <Button variant="primary" type="submit">
                      Save changes
                    </Button>{" "}
                    <Button variant="secondary" type="button" onClick={handleEdit}>
                      Cancel
                    </Button>
                    {/* <Button
                      variant="danger"
                      type="button"
                      onClick={() => handleReset()}
                    >
                      Reset
                    </Button>{" "} */}
                  </Form>
                );
              }}
            </Formik>
          ) : (
            <div className="profile-details">
              <h3>Welcome, {userDetails?.name}</h3>
              <p>
                <strong>Name:</strong> {userDetails?.name} <br />
                <strong>Email:</strong> {userDetails?.email} <br />
                <strong>Phone number:</strong> {userDetails?.phone} <br />
              </p>

              <Button onClick={handleEdit}>Edit</Button>{" "}
              {onDone && (
                <Button variant="secondary" onClick={onDone}>
                  Close
                </Button>
              )}
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default ProfileCard;
