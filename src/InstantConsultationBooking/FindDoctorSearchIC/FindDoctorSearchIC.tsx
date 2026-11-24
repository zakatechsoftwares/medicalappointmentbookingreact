import { useEffect, useState } from "react";
import "./FindDoctorSearchIC.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../api";

// Used until the list loads from the server (or if it can't be reached)
const FALLBACK_SPECIALITIES = [
  "Dentist",
  "Gynecologist/obstetrician",
  "General Physician",
  "Dermatologist",
  "Ear-nose-throat (ent) Specialist",
  "Paediatrician",
];

const FindDoctorSearchIC = () => {
  const [doctorResultHidden, setDoctorResultHidden] = useState(true);
  const [searchParams] = useSearchParams();
  const [searchDoctor, setSearchDoctor] = useState(searchParams.get("speciality") ?? "");
  const [specialities, setSpecialities] = useState<string[]>(FALLBACK_SPECIALITIES);
  const navigate = useNavigate();

  useEffect(() => {
    api<string[]>("/api/doctors/specialities")
      .then((list) => list.length && setSpecialities(list))
      .catch(() => {});
  }, []);

  // Filter the dropdown as the user types
  const matches = specialities.filter((s) =>
    s.toLowerCase().includes(searchDoctor.trim().toLowerCase())
  );
  const handleDoctorSelect = (speciality: string) => {
    setSearchDoctor(speciality);
    setDoctorResultHidden(true);
    navigate(`/instant-consultation?speciality=${encodeURIComponent(speciality)}`);
  };
  return (
    <div className="finddoctor z-0">
      <center>
        <h1>Find a doctor and Consult instantly</h1>
        <div>
          {" "}
          <i
            style={{ color: "#000000", fontSize: "20rem" }}
            className="fa fa-user-md"
          ></i>
        </div>{" "}
        <div
          className="home-search-container"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div className="doctor-search-box z-0">
            {/* <p>Perform a search to see the results.</p> */}

            <input
              type="text"
              className="search-doctor-input-box "
              placeholder="Search by speciality, e.g. Dentist"
              onFocus={() => setDoctorResultHidden(false)}
              onBlur={() => setDoctorResultHidden(true)}
              value={searchDoctor}
              onChange={(e) => setSearchDoctor(e.target.value)}
            />

            <div className="findiconimg">
              <img
                className="findIcon"
                src={"/images/search.svg"}
                alt=""
              />
            </div>
            <div
              className="search-doctor-input-results"
              hidden={doctorResultHidden}
            >
              {(matches.length ? matches : specialities).map((speciality) => (
                <div
                  className="search-doctor-result-item z-0"
                  key={speciality}
                  onMouseDown={() => handleDoctorSelect(speciality)}
                >
                  <span>
                    <img
                      src={"/images/search.svg"}
                      alt=""
                      style={{ height: "10px", width: "10px" }}
                      width="12"
                    />
                  </span>
                  <span>{speciality}</span>
                  <span>SPECIALITY</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </center>
    </div>
  );
};

export default FindDoctorSearchIC;
