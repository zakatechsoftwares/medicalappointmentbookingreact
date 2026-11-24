import { useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import "./Login.css";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import FormGroup from "react-bootstrap/FormGroup";
import FormLabel from "react-bootstrap/FormLabel";
import FormControl from "react-bootstrap/FormControl";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as yup from "yup";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../Routes/AuthHook";
import { errorMessage } from "../../api";

function Login() {
  const navigate = useNavigate();
  const schema = yup.object().shape({
    email: yup.string().email().required(),
    password: yup.string().required(),
  });
  interface valueType {
    email: string;

    password: string;
  }
  const initialValues: valueType = {
    email: "",

    password: "",
  };

  const { user, login } = useAuth();
  const location = useLocation();
  const [error, setError] = useState("");
  const redirectTo = (location.state as { from?: string } | null)?.from || "/instant-consultation";

  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [user, navigate, redirectTo]);

  const handleLogin = async (values: valueType) => {
    setError("");
    try {
      await login(values.email, values.password);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <Container fluid>
      <Row>
        <Col md={4}></Col>
        <Col md={4}>
          <div className="signup-grid">
            <div className="signup-text">
              <h1>Login</h1>
            </div>
          </div>

          <Formik
            validationSchema={schema}
            onSubmit={handleLogin}
            initialValues={initialValues}
          >
            {({ handleReset, isSubmitting }) => {
              return (
                <Form>
                  {error && <Alert variant="danger">{error}</Alert>}
                  <FormLabel>
                    Do not have account?{" "}
                    <Link to="/sign_up" style={{ color: "#2190FF" }}>
                      Register
                    </Link>
                  </FormLabel>
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
                    {isSubmitting ? "Logging in..." : "Login"}
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

export default Login;
