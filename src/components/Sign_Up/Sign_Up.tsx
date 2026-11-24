import "./Sign_Up.css";
import { useEffect, useState } from "react";
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
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../Routes/AuthHook";
import { errorMessage } from "../../api";

function Sign_Up() {
  const [showerr, setShowerr] = useState("");

  const navigate = useNavigate();
  const schema = yup.object().shape({
    name: yup.string().min(4, "Name should be at least 4 characters").required(),
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
      .matches(/^(\+234\d{10}|0\d{10})$/, "Enter a valid Nigerian phone number, e.g. 08012345678"),
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
  const { user, register } = useAuth();

  useEffect(() => {
    if (user) navigate("/instant-consultation", { replace: true });
  }, [user, navigate]);

  const handleFormSubmit = async (values: valueType) => {
    setShowerr("");
    try {
      await register(values);
    } catch (e) {
      setShowerr(errorMessage(e));
    }
  };

  return (
    <Container fluid>
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
            {({ handleReset, isSubmitting }) => {
              return (
                <Form>
                  {showerr && <Alert variant="danger">{showerr}</Alert>}
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
                    <ErrorMessage name="password" />
                  </FormGroup>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating account..." : "Sign Up"}
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
