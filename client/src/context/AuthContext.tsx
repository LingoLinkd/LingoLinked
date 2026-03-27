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

  useEffect(() => {
    if (!token) return;

    api
      .get<{ user: User }>("/auth/me")
      .then(({ user }) => setUser(user))
      .catch(() => {
        localStorage.removeItem("token");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await api.post<{ token: string; user: User }>("/auth/login", {
      email,
      password,
    });
    localStorage.setItem("token", token);
    setToken(token);
    setUser(user);
  }, []);

  const register = useCallback(
    async (data: { email: string; password: string; firstName: string; lastName: string }) => {
      const { token, user } = await api.post<{ token: string; user: User }>("/auth/register", data);
      localStorage.setItem("token", token);
      setToken(token);
      setUser(user);
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback(async (data: Partial<User>) => {
    const { user } = await api.put<{ user: User }>("/users/profile", data);
    setUser(user);
  }, []);

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
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}