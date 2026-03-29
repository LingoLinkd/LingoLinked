import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "../AuthContext";

vi.mock("../../utils/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    upload: vi.fn(),
  },
}));
import { api } from "../../utils/api";

const mockUser = {
  _id: "user1",
  email: "test@rpi.edu",
  firstName: "Test",
  lastName: "User",
  bio: "A test bio",
  profilePicture: "",
  knownLanguages: [{ language: "English", proficiency: "native" }],
  learningLanguages: [{ language: "Spanish", proficiency: "beginner" }],
  interests: ["Travel", "Music"],
  university: "RPI",
  major: "CS",
  yearOfStudy: "Junior",
  accountStatus: "active",
  role: "both",
  createdAt: "2024-01-01T00:00:00.000Z",
};

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("AuthContext", () => {
  it("throws error when useAuth is used outside AuthProvider", () => {
    // Suppress console.error for the expected error
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within AuthProvider");
    spy.mockRestore();
  });

  it("starts with loading=false and user=null when no token in localStorage", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("fetches user from /auth/me when token exists in localStorage", async () => {
    localStorage.setItem("token", "existing-token");
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ user: mockUser });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // loading should start as true when token exists
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(api.get).toHaveBeenCalledWith("/auth/me");
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe("existing-token");
  });

  it("clears token and state when /auth/me fails", async () => {
    localStorage.setItem("token", "bad-token");
    (api.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Unauthorized"));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("login stores token, sets user, and updates state", async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      token: "new-token",
      user: mockUser,
    });
    // Login sets token state, which triggers the useEffect to call /auth/me
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ user: mockUser });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("test@rpi.edu", "password123");
    });

    expect(api.post).toHaveBeenCalledWith("/auth/login", {
      email: "test@rpi.edu",
      password: "password123",
    });
    expect(result.current.token).toBe("new-token");
    expect(result.current.user).toEqual(mockUser);
    expect(localStorage.getItem("token")).toBe("new-token");
  });

  it("register stores token, sets user, and updates state", async () => {
    const regData = {
      email: "new@rpi.edu",
      password: "password123",
      firstName: "New",
      lastName: "User",
    };
    const regUser = { ...mockUser, email: "new@rpi.edu", firstName: "New" };
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      token: "reg-token",
      user: regUser,
    });
    // Register sets token state, which triggers the useEffect to call /auth/me
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ user: regUser });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register(regData);
    });

    expect(api.post).toHaveBeenCalledWith("/auth/register", regData);
    expect(result.current.token).toBe("reg-token");
    expect(localStorage.getItem("token")).toBe("reg-token");
  });

  it("logout clears token, user, and localStorage", async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      token: "active-token",
      user: mockUser,
    });
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ user: mockUser });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("test@rpi.edu", "password123");
    });

    expect(result.current.user).toEqual(mockUser);

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("updateUser calls api.put and updates user state", async () => {
    const updatedUser = { ...mockUser, bio: "Updated bio" };
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      token: "t",
      user: mockUser,
    });
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ user: mockUser });
    (api.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: updatedUser,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("test@rpi.edu", "pass");
    });

    await act(async () => {
      await result.current.updateUser({ bio: "Updated bio" });
    });

    expect(api.put).toHaveBeenCalledWith("/users/profile", { bio: "Updated bio" });
    expect(result.current.user?.bio).toBe("Updated bio");
  });

  it("refreshUser calls api.get(/auth/me) and updates user state", async () => {
    const refreshedUser = { ...mockUser, firstName: "Refreshed" };
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      token: "t",
      user: mockUser,
    });
    // Login sets token → useEffect calls /auth/me
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ user: mockUser });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("test@rpi.edu", "pass");
    });

    // Now mock the refreshUser call to /auth/me
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: refreshedUser,
    });

    await act(async () => {
      await result.current.refreshUser();
    });

    expect(api.get).toHaveBeenCalledWith("/auth/me");
    expect(result.current.user?.firstName).toBe("Refreshed");
  });
});
