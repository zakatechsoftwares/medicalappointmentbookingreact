import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api";
import ClinicCard from "../../ui/ClinicCard";
import { FALLBACK_SPECIALITIES } from "../../utils/specialities";
import "./LandingPage.css";

/** A sample card for the hero: the next weekday at 10:30 */
function sampleDate() {
  const d = new Date();
  do d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function LandingPag() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [specialities, setSpecialities] = useState<string[]>(FALLBACK_SPECIALITIES);

  useEffect(() => {
    api<string[]>("/api/doctors/specialities")
      .then((list) => list.length && setSpecialities(list))
      .catch(() => {});
  }, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/instant-consultation?search=${encodeURIComponent(q)}` : "/instant-consultation");
  };

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <h1 className="hero-title">See a doctor without the long queue.</h1>
            <p className="hero-lede">
              Choose a doctor, pick a time that suits you, and show your clinic card at the front
              desk.
            </p>

            <form className="hero-search" role="search" onSubmit={search}>
              <label htmlFor="hero-q" className="visually-hidden">
                Search for a doctor or speciality
              </label>
              <input
                id="hero-q"
                className="input"
                type="search"
                placeholder="Try “dentist” or a doctor's name"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                Search
              </button>
            </form>

            <div className="chip-row" aria-label="Browse by speciality">
              {specialities.map((s) => (
                <Link key={s} className="chip" to={`/instant-consultation?speciality=${encodeURIComponent(s)}`}>
                  {s}
                </Link>
              ))}
            </div>
          </div>

          <div className="hero-card" aria-hidden="true">
            <ClinicCard
              doctorName="Dr. Funmilayo Adeyemi"
              speciality="Gynecologist/obstetrician"
              date={sampleDate()}
              timeSlot="10:30"
              patientName="You"
              reason="Antenatal check-up"
              status="confirmed"
            />
          </div>
        </div>
      </section>

      <section className="steps page" aria-labelledby="how-title">
        <h2 id="how-title">How booking works</h2>
        <ol className="steps-list">
          <li>
            <h3>Choose a doctor</h3>
            <p>Search by speciality or name. Each doctor shows their fee and the days they consult.</p>
          </li>
          <li>
            <h3>Pick a free time</h3>
            <p>You only see slots that are still open, so two people can never get the same one.</p>
          </li>
          <li>
            <h3>Show your clinic card</h3>
            <p>
              Your booking appears as a clinic card on your phone. The clinic confirms it, and you
              can cancel any time before.
            </p>
          </li>
        </ol>
        <Link to="/instant-consultation" className="btn btn-primary">
          Find a doctor
        </Link>
      </section>
    </>
  );
}

export default LandingPag;
