import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import FindDoctorSearchIC from "./FindDoctorSearchIC/FindDoctorSearchIC";
import DoctorCardIC from "./DoctorCardIC/DoctorCardIC";
import { api, errorMessage } from "../api";
import { DoctorType } from "../redux/DataType/DataType";
import "./InstantConsultation.css";

const InstantConsultation = () => {
  const [params, setParams] = useSearchParams();
  const speciality = params.get("speciality") ?? "";
  const search = params.get("search") ?? "";
  const [doctors, setDoctors] = useState<DoctorType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const q = new URLSearchParams();
    if (speciality) q.set("speciality", speciality);
    if (search) q.set("search", search);
    setLoading(true);
    setError("");
    api<DoctorType[]>(`/api/doctors?${q}`)
      .then((data) => !cancelled && setDoctors(data))
      .catch((e) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [speciality, search]);

  const heading = speciality || "Find a doctor";

  return (
    <div className="page">
      <div className="page-head">
        <h1>{heading}</h1>
        <p>Pick a doctor to see their free times. Booking takes about a minute.</p>
      </div>

      <FindDoctorSearchIC />

      <div aria-live="polite" aria-busy={loading}>
        {loading && <div className="spinner" role="status" aria-label="Loading doctors" />}
        {error && <div className="notice notice-error">{error}</div>}

        {!loading && !error && (
          <>
            <p className="results-count muted">
              {doctors.length === 0
                ? "No doctors match that search."
                : `${doctors.length} doctor${doctors.length === 1 ? "" : "s"}${search ? ` matching “${search}”` : ""}`}
            </p>
            {doctors.length > 0 ? (
              <ul className="list panel doctor-list">
                {doctors.map((doctor) => (
                  <li key={doctor.id}>
                    <DoctorCardIC doctor={doctor} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="panel empty">
                <p>Try another speciality, or clear the search to see every doctor.</p>
                <button type="button" className="btn btn-quiet" onClick={() => setParams({})}>
                  Show all doctors
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InstantConsultation;
