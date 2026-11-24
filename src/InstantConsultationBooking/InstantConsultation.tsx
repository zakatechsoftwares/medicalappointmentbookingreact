import { useEffect, useState } from "react";
import "./InstantConsultation.css";
import { useSearchParams } from "react-router-dom";
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";
import FindDoctorSearchIC from "./FindDoctorSearchIC/FindDoctorSearchIC";
import DoctorCardIC from "./DoctorCardIC/DoctorCardIC";
import { api, errorMessage } from "../api";
import { DoctorType } from "../redux/DataType/DataType";

const InstantConsultation = () => {
  const [searchParams] = useSearchParams();
  const speciality = searchParams.get("speciality") ?? "";
  const [doctors, setDoctors] = useState<DoctorType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Re-run only when the chosen speciality changes (it used to refetch on every render)
  useEffect(() => {
    if (!speciality) {
      setDoctors([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    api<DoctorType[]>(`/api/doctors?speciality=${encodeURIComponent(speciality)}`)
      .then((data) => !cancelled && setDoctors(data))
      .catch((e) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [speciality]);

  return (
    <center>
      <div className="searchpage-container">
        <FindDoctorSearchIC />
        <div className="search-results-container">
          {loading && <Spinner animation="border" role="status" />}
          {error && <Alert variant="danger">{error}</Alert>}
          {speciality && !loading && !error && (
            <center>
              <h2>
                {doctors.length} {doctors.length === 1 ? "doctor is" : "doctors are"} available
              </h2>
              <h3>Book appointments with minimum wait-time & verified doctor details</h3>
              {doctors.length > 0 ? (
                doctors.map((doctor) => <DoctorCardIC doctor={doctor} key={doctor.id} />)
              ) : (
                <p>No doctors found.</p>
              )}
            </center>
          )}
        </div>
      </div>
    </center>
  );
};

export default InstantConsultation;
