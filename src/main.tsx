import "bootstrap/dist/css/bootstrap.css";
import React from "react";
import ReactDOM from "react-dom/client";

import { Provider } from "react-redux";
import store from "./redux/store.tsx";
//import ProtectedRoute from "./components/Routes/ProtectedRoute.tsx";
import AuthProvider from "./components/Routes/AuthProvider.tsx";

//import Layout from "./components/Layout/Layout.tsx";
import LandingPag from "./components/Landing_Page/LandingPag.tsx";
import Login from "./components/Login/Login.tsx";
import Sign_Up from "./components/Sign_Up/Sign_Up.tsx";
import InstantConsultation from "./InstantConsultationBooking/InstantConsultation.tsx";
import Reviews from "./components/ReviewForm/Reviews.tsx";
import ReportsLayout from "./components/ReportsLayout/ReportsLayout.tsx";
import PdfDisplay from "./components/ReportsLayout/ReportPdfDisplay.tsx";
import Notification from "./components/Notification/notification.tsx";

//import ProtectedRoute from "./components/Routes/ProtectedRoute.tsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout.tsx";

const protectedroutes =
  // createBrowserRouter(
  // user === undefined
  //   ?
  [
    //{
    // element: <Layout />,
    // children: [

    // { path: "/navbar", element: <Navbar /> },

    {
      path: "/instant-consultation",
      element: <InstantConsultation />,
    },
    { path: "/reviews", element: <Reviews /> },
    { path: "/reportlayout", element: <ReportsLayout /> },
    { path: "/reportdisplay", element: <PdfDisplay /> },
    //   ],
    // },
    //   ]
    // :
    // [
  ];
//);

const publicRoute = [
  { path: "/", element: <LandingPag /> },
  { path: "/login", element: <Login /> },
  { path: "/sign_up", element: <Sign_Up /> },
];

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <Notification></Notification>
        <Router>
          <Routes>
            <Route element={<Layout />}>
              {protectedroutes.map((arg) => {
                return (
                  <Route path={arg.path} element={arg.element} key={arg.path} />
                );
              })}
            </Route>

            {publicRoute.map((arg) => {
              return (
                <Route path={arg.path} element={arg.element} key={arg.path} />
              );
            })}
          </Routes>
        </Router>
        {/* <RouterProvider router={routes} /> */}
      </AuthProvider>
    </Provider>
  </React.StrictMode>
);
