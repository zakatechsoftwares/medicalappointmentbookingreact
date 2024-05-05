import { Outlet } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import Login from "../Login/Login";
import { UserContext } from "../Routes/ProtectedRoute";
import { useContext } from "react";

//import LandingPag from "../Landing_Page/LandingPag";
//import { Navigate } from "react-router-dom";

function Layout() {
  const user = useContext(UserContext);
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: "3%" }}>{user ? <Outlet /> : <Login />}</div>
    </>
  );
}

export default Layout;
