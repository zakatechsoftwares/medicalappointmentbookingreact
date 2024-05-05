import { useEffect, createContext, PropsWithChildren, useState } from "react";
import { useNavigate } from "react-router-dom";

//import Notification from "../Notification/notification";

import { UserType } from "../../redux/DataType/DataType";

export const UserContext = createContext<UserType | null | undefined>(null);

//const [isLoggedIn, setIsLoggedIn] = useState(false);
//const [username, setUsername] = useState("");
//  const navigate = useNavigate();

export default function ProtectedRoute({ children }: PropsWithChildren) {
  const [user, setUser] = useState();
  useEffect(() => {
    const storedemail = sessionStorage.getItem("email") as string;

    fetch("http://localhost:8181/api/auth/user", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        email: storedemail, // Add the email to the headers
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setUser(data); // Handle the response data here
      })
      .catch((error) => {
        console.error("There was a problem with your fetch operation:", error);
      });
  }, []);
  const navigate = useNavigate();

  useEffect(() => {
    // if (user === null || undefined) {
    //   console.log(user + "protected route");
    navigate("/signin", { replace: true });
    // }
  }, [navigate, user]);

  return children;
}

// return (
//   <UserContext.Provider value={user}>
//     <Notification></Notification>
//     <RouterProvider router={publicRoute} />
//   </UserContext.Provider>
// );
