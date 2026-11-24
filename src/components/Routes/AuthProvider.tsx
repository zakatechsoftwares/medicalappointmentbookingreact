import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import { api, setUnauthorizedHandler, tokenStore } from "../../api";
import { UserType } from "../../redux/DataType/DataType";
import { useAppDispatch } from "../../redux/store";
import { clearBookings, fetchAppointments } from "../../redux/slice/bookingSlice";
import { AuthContext, RegisterData } from "./AuthContext";

interface AuthResponse {
  authtoken: string;
  user: UserType;
}

export default function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState<boolean>(() => Boolean(tokenStore.get()));
  const dispatch = useAppDispatch();

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    dispatch(clearBookings());
  }, [dispatch]);

  const startSession = useCallback(
    (data: AuthResponse) => {
      tokenStore.set(data.authtoken);
      setUser(data.user);
      dispatch(fetchAppointments());
    },
    [dispatch]
  );

  // On page load, restore the session from a saved token
  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!tokenStore.get()) return;
    api<UserType>("/api/auth/me")
      .then((me) => {
        setUser(me);
        dispatch(fetchAppointments());
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [dispatch, logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      startSession(
        await api<AuthResponse>("/api/auth/login", { method: "POST", body: { email, password } })
      );
    },
    [startSession]
  );

  const register = useCallback(
    async (data: RegisterData) => {
      startSession(await api<AuthResponse>("/api/auth/register", { method: "POST", body: data }));
    },
    [startSession]
  );

  const updateProfile = useCallback(async (data: { name: string; phone: string }) => {
    setUser(await api<UserType>("/api/auth/me", { method: "PUT", body: data }));
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateProfile }),
    [user, loading, login, register, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
