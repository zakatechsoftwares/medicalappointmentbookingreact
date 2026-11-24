import "./LandingPage.css";
import { Link } from "react-router-dom";
import Navbar from "../Navbar/Navbar.tsx";

function LandingPag() {
  return (
    <>
      {<Navbar />}
      <section className="hero-section">
        <div>
          <div data-aos="fade-up" className="flex-hero">
            <h1>
              Your Health
              <br />
              <span className="text-gradient">Our Responsibility</span>
            </h1>
            <div className="blob-cont">
              <div className="blue blob"></div>
            </div>
            <div className="blob-cont">
              <div className="blue1 blob"></div>
            </div>
            <h4>
              Find a trusted doctor, pick a time that suits you and book your
              consultation in minutes, from the comfort of your home.
            </h4>
            <Link to="/instant-consultation">
              <button className="button">Get Started</button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default LandingPag;
