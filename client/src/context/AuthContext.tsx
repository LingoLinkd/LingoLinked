import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api } from "../utils/api";

interface Language {
  language: string;
  proficiency: string;
}

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  bio: string;
  profilePicture: string;
  knownLanguages: Language[];
  learningLanguages: Language[];
  interests: string[];
  university: string;
  major: string;
  yearOfStudy: string;
  accountStatus: string;
  role: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(() => !!token);

    // on mount validates the stored token by fetching the logged in user profile
  useEffect(() => {
    if (!token) return;

    api
      .get<{ user: User }>("/auth/me")
      .then(({ user }) => setUser(user))
      .catch(() => {
        // token is invalid or expired so clear it and fall back to logged out state
        localStorage.removeItem("token");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  // posts credentials to the api then stores the token and updates user state
  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await api.post<{ token: string; user: User }>("/auth/login", {
      email,
      password,
    });
    localStorage.setItem("token", token);
    setToken(token);
    setUser(user);
  }, []);

  // calls the register endpoint then stores the token and sets initial user state
  const register = useCallback(
    async (data: { email: string; password: string; firstName: string; lastName: string }) => {
      const { token, user } = await api.post<{ token: string; user: User }>("/auth/register", data);
      localStorage.setItem("token", token);
      setToken(token);
      setUser(user);
    },
    []
  );

  // removes the token from storage and clears all user state
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  // sends partial profile fields to the api and syncs the local user state
  const updateUser = useCallback(async (data: Partial<User>) => {
    const { user } = await api.put<{ user: User }>("/users/profile", data);
    setUser(user);
  }, []);

  // fetches fresh user data from the api to keep local state in sync
  const refreshUser = useCallback(async () => {
    const { user } = await api.get<{ user: User }>("/auth/me");
    setUser(user);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, updateUser, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
// throws if called outside of the authprovider tree
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}