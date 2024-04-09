import "bootstrap/dist/css/bootstrap.css";
import React from "react";
import ReactDOM from "react-dom/client";
import Navbar from "./components/Navbar/Navbar.tsx";
import LandingPag from "./components/Landing_Page/LandingPag.tsx";
import Sign_Up from "./components/Sign_Up/Sign_Up.tsx";
import Login from "./components/Login/Login.tsx";
import InstantConsultation from "./InstantConsultationBooking/InstantConsultation.tsx";
import { Provider } from "react-redux";
import store from "./redux/store.tsx";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Notification from "./components/Notification/notification.tsx";
//import { Container } from "react-bootstrap";

const router = createBrowserRouter([
  { path: "/", element: <LandingPag /> },
  { path: "/navbar", element: <Navbar /> },
  { path: "/login", element: <Login /> },
  { path: "/sign_up", element: <Sign_Up /> },
  { path: "/instant-consultation", element: <InstantConsultation /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <Notification></Notification>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);
