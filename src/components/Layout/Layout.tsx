import { Outlet } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import Notification from "../Notification/notification";
import Footer from "./Footer";

function Layout() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Navbar />
      <Notification />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default Layout;
