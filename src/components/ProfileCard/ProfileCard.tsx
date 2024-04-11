import {
  //ChangeEvent,
  useState,
} from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import FormGroup from "react-bootstrap/FormGroup";
import FormLabel from "react-bootstrap/FormLabel";
import FormControl from "react-bootstrap/FormControl";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as yup from "yup";

import { API_URL } from "../../config.tsx";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
//import { ReactNode } from "react";
interface UserDetailType {
  name: string;
  email: string;
  phone: string;
}

function ProfileCard() {
  const [userDetails, setUserDetails] = useState<UserDetailType>();
  const [editMode, setEditMode] = useState(false);
  console.log("editmode", editMode);

  const navigate = useNavigate();
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
      .matches(/^\d{11}$/, "Phone number must be exactly 11 digits"),
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
  const fetchUserProfile = async () => {
    try {
      const authtoken = sessionStorage.getItem("auth-token");
      const email = sessionStorage.getItem("email"); // Get the email from session storage
      if (!authtoken) {
        navigate("/login");
      } else {
        const response = await fetch(`${API_URL}/api/auth/user`, {
          headers: {
            Authorization: `Bearer ${authtoken}`,
            Email: email || "", // Add the email to the headers
          },
        });
        if (response.ok) {
          const user = await response.json();
          setUserDetails(user);
          // setUpdatedDetails(user);
        } else {
          // Handle error case
          throw new Error("Failed to fetch user profile");
        }
      }
    } catch (error) {
      console.error(error);
      // Handle error case
    }
  };

  const handleEdit = () => {
    setEditMode(!editMode);
  };

  const handleSubmit = async (values: valueType) => {
    try {
      const authtoken = sessionStorage.getItem("auth-token");
      const email = sessionStorage.getItem("email"); // Get the email from session storage

      if (!authtoken || !email) {
        navigate("/login");
        return;
      }
      const payload = { name: values.name, phone: values.phone };
      const response = await fetch(`${API_URL}/api/auth/user`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authtoken}`,
          "Content-Type": "application/json",
          Email: email,
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        // Update the user details in session storage
        sessionStorage.setItem("name", values.name);
        sessionStorage.setItem("phone", values.phone);
        setUserDetails(values);
        setEditMode(false);
        // Display success message to the user
        alert(`Profile Updated Successfully!`);
        navigate("/");
      } else {
        // Handle error case
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error(error);
      // Handle error case
    }
  };

  useEffect(() => {
    const authtoken = sessionStorage.getItem("auth-token");
    if (!authtoken) {
      navigate("/login");
    } else {
      fetchUserProfile();
    }
  });

  return (
    <Container fluid>
      <Row>
        <Col>
          <div className="signup-grid">
            <div className="signup-text">
              <h1>Profile</h1>
            </div>
          </div>

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
                      Submit edited
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
                <strong>Phone number:</strong>
                {userDetails?.phone} <br />
              </p>

              <button onClick={handleEdit}>Edit</button>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default ProfileCard;
