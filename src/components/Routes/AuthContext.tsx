import { createContext } from "react";
import { UserType } from "../../redux/DataType/DataType";

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthContextValue {
  user: UserType | null;
  /** true while we check a saved token on page load */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name: string; phone: string }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
