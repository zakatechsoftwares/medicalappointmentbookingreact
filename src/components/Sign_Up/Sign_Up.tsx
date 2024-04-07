import "./Sign_Up.css";
import { useState } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import FormGroup from "react-bootstrap/FormGroup";
import FormLabel from "react-bootstrap/FormLabel";
import FormControl from "react-bootstrap/FormControl";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as yup from "yup";
import { Link } from "react-router-dom";
import { API_URL } from "../../config.tsx";
import { useNavigate } from "react-router-dom";
//import { ReactNode } from "react";

function Sign_Up() {
  const [showerr, setShowerr] = useState("");

  const navigate = useNavigate();
  const schema = yup.object().shape({
    name: yup.string().required(),
    email: yup
      .string()

      .email()
      .required(),
    password: yup
      .string()
      .min(8, "Password must be at least 8 characters long")

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
    password: string;
  }
  const initialValues: valueType = {
    name: "",
    email: "",
    phone: "",
    password: "",
  };
  const handleFormSubmit = async (values: valueType) => {
    // API Call
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
    const json = await response.json();
    if (json.authtoken) {
      sessionStorage.setItem("auth-token", json.authtoken);
      sessionStorage.setItem("name", values.name);
      // phone and email
      sessionStorage.setItem("phone", values.phone);
      sessionStorage.setItem("email", values.email);
      // Redirect to home page
      navigate("/"); //on directing to home page you need to give logic to change login and signup buttons with name of the user and logout button where you have implemented Navbar functionality
      window.location.reload();
    } else {
      if (json.errors) {
        for (const error of json.errors) {
          setShowerr(error.msg);
        }
      } else {
        setShowerr(json.error);
      }
    }
  };

  return (
    <Container fluid>
      {showerr}
      <Row>
        <Col md={4}></Col>
        <Col md={4}>
          <div className="signup-grid">
            <div className="signup-text">
              <h1>Sign Up</h1>
            </div>
          </div>

          <Formik
            validationSchema={schema}
            onSubmit={handleFormSubmit}
            initialValues={initialValues}
          >
            {({ handleReset }) => {
              return (
                <Form>
                  <FormLabel>
                    Already a member{" "}
                    <Link to="/login" style={{ color: "#2190FF" }}>
                      Login
                    </Link>
                  </FormLabel>
                  <FormGroup className="mb-3" controlId="formBasicName">
                    <FormLabel className="fw-bold">Name</FormLabel>
                    <Field
                      as={FormControl}
                      type="text"
                      placeholder="Enter your name"
                      style={{ width: "100%" }}
                      name="name"
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
                      as={FormControl}
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      style={{ width: "100%" }}
                    />
                    <ErrorMessage name="email" />
                  </FormGroup>
                  <FormGroup className="mb-3" controlId="formBasicPassword">
                    <FormLabel className="fw-bold">Password</FormLabel>
                    <Field
                      as={FormControl}
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      style={{ width: "100%" }}
                    />
                  </FormGroup>
                  <Button
                    variant="primary"
                    type="submit"
                    // onClick={() => console.log(field)}
                  >
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
        <Col md={4}></Col>
      </Row>
    </Container>
  );
}

export default Sign_Up;

// import React from "react";
// import { Formik, Form, Field, ErrorMessage } from "formik";
// import {
//   Container,
//   Row,
//   Col,
//   Button,
//   FormGroup,
//   FormLabel,
//   FormControl,
// } from "react-bootstrap";

// interface MyFormValues {
//   firstName: string;
// }

// const initialValues: MyFormValues = {
//   firstName: "",
// };

// const MyForm: React.FC = () => {
//   const onSubmit = (values: MyFormValues) => {
//     console.log(values);
//     // Handle form submission logic here
//   };

//   const validate = (values: MyFormValues) => {
//     const errors: Partial<MyFormValues> = {};
//     if (!values.firstName) {
//       errors.firstName = "Required";
//     }
//     return errors;
//   };

//   return (
//     <Container>
//       <Row>
//         <Col md={{ span: 6, offset: 3 }}>
//           <Formik
//             initialValues={initialValues}
//             onSubmit={onSubmit}
//             validate={validate}
//           >
//             {() => (
//               <Form>
//                 <FormGroup>
//                   <FormLabel>First Name</FormLabel>
//                   <Field
//                     type="text"
//                     name="firstName"
//                     placeholder="Enter your first name"
//                     as={FormControl}
//                   />
//                   <ErrorMessage
//                     name="firstName"
//                     component="div"
//                     className="text-danger"
//                   />
//                 </FormGroup>

//                 <Button variant="primary" type="submit">
//                   Submit
//                 </Button>
//                 <Button variant="primary" type="reset">
//                   Submit
//                 </Button>
//               </Form>
//             )}
//           </Formik>
//         </Col>
//       </Row>
//     </Container>
//   );
// };

// export default MyForm;
