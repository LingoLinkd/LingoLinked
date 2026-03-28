import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Navbar from "../Navbar";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));
import { useAuth } from "../../context/AuthContext";

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

const mockLogout = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    user: mockUser,
    token: "fake-token",
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: mockLogout,
    updateUser: vi.fn(),
    refreshUser: vi.fn(),
  });
});

function renderNavbar() {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );
}

describe("Navbar", () => {
  it("renders navigation links for Home, Matches, Messages, and Events", () => {
    renderNavbar();

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Matches")).toBeInTheDocument();
    expect(screen.getByText("Messages")).toBeInTheDocument();
    expect(screen.getByText("Events")).toBeInTheDocument();
  });

  it("displays the LingoLinked brand", () => {
    renderNavbar();

    expect(screen.getByText("LingoLinked")).toBeInTheDocument();
  });

  it("shows user initials when no profile picture is set", () => {
    renderNavbar();

    expect(screen.getByText("TU")).toBeInTheDocument();
  });

  it("shows profile picture when user has one", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { ...mockUser, profilePicture: "/uploads/avatar.jpg" },
      token: "fake-token",
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
      updateUser: vi.fn(),
      refreshUser: vi.fn(),
    });

    renderNavbar();

    const img = screen.getByAltText("Test");
    expect(img).toHaveAttribute("src", "/uploads/avatar.jpg");
  });

  it("calls logout and navigates to /login when Log Out is clicked", async () => {
    const user = userEvent.setup();
    renderNavbar();

    const logoutBtn = screen.getByText("Log Out");
    await user.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
