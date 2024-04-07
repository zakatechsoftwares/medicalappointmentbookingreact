import { useEffect, useState } from "react";
import "./InstantConsultation.css";
import { useSearchParams } from "react-router-dom";
import FindDoctorSearchIC from "./FindDoctorSearchIC/FindDoctorSearchIC";
import DoctorCardIC from "./DoctorCardIC/DoctorCardIC";

const InstantConsultation = () => {
  const [searchParams] = useSearchParams();
  // const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [isSearched, setIsSearched] = useState(false);
  interface Doctor {
    name: string;
    ratings: number;
    experience: number;
    speciality: string;
    profilePic: string;
  }

  const getDoctorsDetails = () => {
    fetch("https://api.npoint.io/9a5543d36f1460da2f63")
      .then((res) => res.json())
      .then((data) => {
        const specialty = searchParams.get("speciality") as string;
        if (specialty) {
          // window.reload()
          const filtered = data.filter(
            (doctor: Doctor) =>
              doctor.speciality.toLowerCase() === specialty.toLowerCase()
          );

          setFilteredDoctors(filtered);

          setIsSearched(true);
          //  window.reload();
        } else {
          setFilteredDoctors([]);
          setIsSearched(false);
        }
        // setDoctors(data);
      })
      .catch((err) => console.log(err));
  };
  // const handleSearch = (searchText:string) => {
  //   if (searchText === "") {
  //     setFilteredDoctors([]);
  //     setIsSearched(false);
  //   } else {
  //     const filtered = doctors.filter((doctor:Doctor) =>
  //       //
  //       doctor.speciality.toLowerCase().includes(searchText.toLowerCase())
  //     );

  //     setFilteredDoctors(filtered);
  //     setIsSearched(true);
  //     window.location.reload();
  //   }
  // };
  //const navigate = useNavigate();
  useEffect(
    () => {
      getDoctorsDetails();
      // const authtoken = sessionStorage.getItem("auth-token");
      // if (!authtoken) {
      //     navigate("/login");
      // }
    } //, [searchParams]
  );

  return (
    <center>
      <div className="searchpage-container">
        <FindDoctorSearchIC
        //onSearch={handleSearch}
        />
        <div className="search-results-container">
          {isSearched ? (
            <center>
              <h2>
                {filteredDoctors.length} doctors are available{" "}
                {searchParams.get("location")}
              </h2>
              <h3>
                Book appointments with minimum wait-time & verified doctor
                details
              </h3>
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doctor: Doctor) => (
                  <DoctorCardIC
                    //   className="doctorcard"

                    {...doctor}
                    key={doctor.name}
                  />
                ))
              ) : (
                <p>No doctors found.</p>
              )}
            </center>
          ) : (
            ""
          )}
        </div>
      </div>
    </center>
  );
};

export default InstantConsultation;
