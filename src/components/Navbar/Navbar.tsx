import "./Navbar.css";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import Button from "react-bootstrap/Button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Popup from "reactjs-popup";
import ProfileCard from "../ProfileCard/ProfileCard";
import ReportsLayout from "../ReportsLayout/ReportsLayout";

// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

function BasicExample() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  //const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const storedemail = sessionStorage.getItem("email");

    if (storedemail) {
      setIsLoggedIn(true);
      setEmail(storedemail);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("auth-token");
    sessionStorage.removeItem("name");
    sessionStorage.removeItem("email");
    sessionStorage.removeItem("phone");
    // remove email phone
    localStorage.removeItem("doctorData");
    setIsLoggedIn(false);
    setEmail("");

    // Remove the reviewFormData from local storage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("reviewFormData_")) {
        localStorage.removeItem(key);
      }
    }
    // setEmail("");
    window.location.reload();
  };

  return (
    <Navbar
      expand="lg"
      className="bg-body-transparent position-fixed top-0"
      style={{ background: "white" }}
    >
      <Container fluid>
        {/* <Navbar.Brand href="#home"> */}
        <div className="nav__logo">
          <a href="/">
            StayHealthy
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="26"
              width="26"
              viewBox="0 0 1000 1000"
              style={{ fill: "#3685fb" }}
            >
              <title>Doctor With Stethoscope SVG icon</title>
              <g>
                <g>
                  <path d="M499.8,10c91.7,0,166,74.3,166,166c0,91.7-74.3,166-166,166c-91.7,0-166-74.3-166-166C333.8,84.3,408.1,10,499.8,10z"></path>
                  <path d="M499.8,522.8c71.2,0,129.1-58.7,129.1-129.1H370.6C370.6,464.1,428.6,522.8,499.8,522.8z"></path>
                  <path d="M693.2,395c-0.7,94.9-70.3,173.7-160.8,188.9v155.9c0,80.3-60.7,150.8-140.8,155.3c-83,4.7-152.7-58.9-157.6-139.7c-22-12.8-35.6-38.5-30.3-66.7c4.7-25.1,25.5-45.6,50.8-49.9c39.7-6.7,74.1,23.7,74.1,62.1c0,23-12.3,43-30.7,54.1c4.7,45.4,45.1,80.4,92.6,76c44.6-4,77.2-44.4,77.2-89.2v-158c-90.5-15.2-160.1-94-160.8-188.9c-89.4,11.5-158.2,87.9-158.2,180.5V910c0,44.2,35.8,80,80,80h542.6c44.2,0,80.1-35.8,80.1-80V575.5C851.4,483,782.6,406.6,693.2,395z"></path>
                </g>
              </g>
            </svg>
          </a>
          <span>.</span>
        </div>
        <div className="nav__icon">
          <i className="fa fa-times fa fa-bars"></i>
        </div>
        {/* </Navbar.Brand> */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        <Navbar.Collapse id="basic-navbar-nav">
          {isLoggedIn && (
            <NavDropdown
              title={`Welcome ${email}`}
              id="basic-nav-dropdown"
              className="ms-auto bg-body-tertiary p-0"
              style={{ backgroundColor: "white" }}
            >
              <NavDropdown.Item className="p-0">
                <Popup
                  trigger={
                    <Button
                      className="m-0"
                      style={{
                        width: "100%",
                        backgroundColor: "transparent",
                        textAlign: "start",
                        color: "black",
                      }}
                    >
                      Your profile
                    </Button>
                  }
                  modal
                  open={open}
                  onClose={() => setOpen(false)}
                >
                  <ProfileCard />
                </Popup>
              </NavDropdown.Item>
              <NavDropdown.Item className="p-0">
                <Popup
                  style={{ width: "100%" }}
                  trigger={
                    <Button
                      className="m-0"
                      style={{
                        width: "100%",
                        backgroundColor: "transparent",
                        textAlign: "start",
                        color: "black",
                      }}
                    >
                      Your Reports
                    </Button>
                  }
                  modal
                  open={open}
                  onClose={() => setOpen(false)}
                >
                  <ReportsLayout />
                </Popup>
              </NavDropdown.Item>
            </NavDropdown>
          )}
          <Nav className="ms-auto justify-content-center align-items-center">
            <Nav.Link href="#home">Home</Nav.Link>
            <Nav.Link href="#link">Appointments</Nav.Link>
            {isLoggedIn || (
              //   <Nav.Link>
              <Button
                variant="outline-primary"
                className="mt-0 mx-0 "
                onClick={() => navigate("/sign_up")}
              >
                Register
              </Button>
              //   </Nav.Link>
            )}
            {/* <Nav.Link> */}
            <Button
              variant="outline-primary"
              className="mt-0 mx-0"
              onClick={() => {
                if (isLoggedIn) {
                  handleLogout();
                } else {
                  navigate("/login");
                }
              }}
            >
              {isLoggedIn ? "Sign Out" : "Login"}
            </Button>
            {/* </Nav.Link> */}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default BasicExample;
