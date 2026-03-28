import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "../Dashboard";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));
import { useAuth } from "../../context/AuthContext";

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

const mockSuggestion = {
  user: {
    _id: "user2",
    email: "partner@rpi.edu",
    firstName: "Jane",
    lastName: "Doe",
    bio: "Language enthusiast",
    profilePicture: "",
    knownLanguages: [{ language: "Spanish", proficiency: "native" }],
    learningLanguages: [{ language: "English", proficiency: "intermediate" }],
    interests: ["Travel"],
    university: "RPI",
    major: "LACS",
    yearOfStudy: "Senior",
    accountStatus: "active",
    role: "both",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  score: 85,
  sharedLanguages: ["Spanish", "English"],
};

beforeEach(() => {
  vi.clearAllMocks();
  (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    user: mockUser,
    token: "fake-token",
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    refreshUser: vi.fn(),
  });
  (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ suggestions: [] });
});

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

describe("Dashboard page", () => {
  it("shows welcome message with user first name", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Welcome back, Test")).toBeInTheDocument();
    });
  });

  it("displays stats for known languages, learning languages, and suggestions count", async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      suggestions: [mockSuggestion],
    });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Languages Known")).toBeInTheDocument();
      expect(screen.getByText("Learning")).toBeInTheDocument();
      expect(screen.getByText("Matches Found")).toBeInTheDocument();
    });

    // Stat values should be rendered (user has 1 known, 1 learning, 1 suggestion)
    const statValues = screen.getAllByText("1");
    expect(statValues.length).toBeGreaterThanOrEqual(3);
  });

  it("shows profile completeness nudge when knownLanguages is empty", async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { ...mockUser, knownLanguages: [], bio: "" },
      token: "fake-token",
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
      refreshUser: vi.fn(),
    });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Complete your profile")).toBeInTheDocument();
    });
  });

  it("does not show profile nudge when profile is complete", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByText("Complete your profile")).not.toBeInTheDocument();
    });
  });

  it("renders UserCard for each suggestion", async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      suggestions: [mockSuggestion],
    });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
      expect(screen.getByText("Language enthusiast")).toBeInTheDocument();
      expect(screen.getByText("85% match")).toBeInTheDocument();
    });
  });

  it("calls api.post to connect when Connect button is clicked", async () => {
    const user = userEvent.setup();
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      suggestions: [mockSuggestion],
    });
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    const connectBtn = screen.getByRole("button", { name: "Connect" });
    await user.click(connectBtn);

    expect(api.post).toHaveBeenCalledWith("/matches/user2/connect", {});
  });
});
