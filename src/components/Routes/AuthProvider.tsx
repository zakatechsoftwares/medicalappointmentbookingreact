import { PropsWithChildren, useState, useEffect } from "react";
import { UserContext } from "./ProtectedRoute";

// import { UserType } from "../../redux/DataType/DataType";

type AuthProviderProps = PropsWithChildren & {
  isSignedIn?: boolean;
};

export default function AuthProvider({
  children,
}: // isSignedIn,
AuthProviderProps) {
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
  // Uses `isSignedIn` prop to determine whether or not to render a user

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}
