// import "./Login.css";

// function Login() {
//   return (
//     <div className="container">
//       <div className="login-grid">
//         <div className="login-text">
//           <h2>Login</h2>
//         </div>
//         <div className="login-text">
//           Are you a new member?
//           <span>
//             <a href="../Sign_Up/Sign_Up.html" style={{ color: "#2190ff" }}>
//               Sign Up Here
//             </a>
//           </span>
//         </div>
//         <br />
//         <div className="login-form">
//           <form>
//             <div className="form-group">
//               <label htmlFor="email">Email</label>
//               <input
//                 type="email"
//                 name="email"
//                 id="email"
//                 className="form-control"
//                 placeholder="Enter your email"
//                 aria-describedby="helpId"
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="password">Password</label>
//               <input
//                 type="password"
//                 name="password"
//                 id="password"
//                 className="form-control"
//                 placeholder="Enter your password"
//                 aria-describedby="helpId"
//               />
//             </div>

//             <div className="btn-group">
//               <button
//                 type="submit"
//                 className="btn btn-primary mb-2 mr-1 waves-effect waves-light"
//               >
//                 Login
//               </button>
//               <button
//                 type="reset"
//                 className="btn btn-danger mb-2 waves-effect waves-light"
//               >
//                 Reset
//               </button>
//             </div>
//             <br />
//             <div className="login-text">Forgot Password?</div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Login;

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
import { Link } from "react-router-dom";
//import { ReactNode } from "react";

function Login() {
  const schema = yup.object().shape({
    email: yup.string().email().required(),
    password: yup.string().email().required(),
  });
  interface valueType {
    email: string;

    password: string;
  }
  const initialValues: valueType = {
    email: "",

    password: "",
  };
  const handleFormSubmit = (values: valueType) => {
    console.log(values);
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
            onSubmit={handleFormSubmit}
            initialValues={initialValues}
          >
            {({ handleReset }) => {
              return (
                <Form>
                  <FormLabel>
                    Do not have account?{" "}
                    {/* <a href="../Login/Login.html" style={{ color: "#2190FF" }}>
                      {" "}
                      Register
                    </a> */}
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

export default Login;
