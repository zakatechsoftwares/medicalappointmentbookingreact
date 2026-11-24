import { Outlet } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import Notification from "../Notification/notification";

function Layout() {
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: "80px" }}>
        <Notification />
        <Outlet />
      </div>
    </>
  );
}

export default Layout;
