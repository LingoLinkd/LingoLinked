import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Matches from "../Matches";

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

const otherUser = {
  _id: "user2",
  email: "other@rpi.edu",
  firstName: "Other",
  lastName: "Person",
  bio: "Other user bio",
  profilePicture: "",
  knownLanguages: [{ language: "Spanish", proficiency: "native" }],
  learningLanguages: [{ language: "English", proficiency: "beginner" }],
  interests: [],
  university: "RPI",
  major: "LACS",
  yearOfStudy: "Senior",
  accountStatus: "active",
  role: "both",
  createdAt: "2024-01-01T00:00:00.000Z",
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
  (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ matches: [] });
});

function renderMatches() {
  return render(
    <MemoryRouter>
      <Matches />
    </MemoryRouter>
  );
}

describe("Matches page", () => {
  it("renders Pending and Connected tabs", async () => {
    renderMatches();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Pending" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Connected" })).toBeInTheDocument();
    });
  });

  it("fetches and displays pending matches", async () => {
    const pendingMatch = {
      _id: "match1",
      users: [mockUser, otherUser],
      score: 75,
      sharedLanguages: ["Spanish"],
      status: "pending",
      initiator: "user2", // incoming match
    };
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ matches: [pendingMatch] });

    renderMatches();

    await waitFor(() => {
      expect(screen.getByText("Other Person")).toBeInTheDocument();
    });

    expect(api.get).toHaveBeenCalledWith("/matches?status=pending");
  });

  it("shows Accept and Decline buttons for incoming pending matches", async () => {
    const incomingMatch = {
      _id: "match1",
      users: [mockUser, otherUser],
      score: 75,
      sharedLanguages: ["Spanish"],
      status: "pending",
      initiator: "user2", // other user initiated, so it's incoming
    };
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ matches: [incomingMatch] });

    renderMatches();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Accept" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Decline" })).toBeInTheDocument();
    });
  });

  it("shows 'Request sent' for outgoing pending matches", async () => {
    const outgoingMatch = {
      _id: "match1",
      users: [mockUser, otherUser],
      score: 75,
      sharedLanguages: ["Spanish"],
      status: "pending",
      initiator: "user1", // current user initiated
    };
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ matches: [outgoingMatch] });

    renderMatches();

    await waitFor(() => {
      expect(screen.getByText("Request sent")).toBeInTheDocument();
    });

    // Should NOT show Accept/Decline buttons
    expect(screen.queryByRole("button", { name: "Accept" })).not.toBeInTheDocument();
  });

  it("shows 'Send Message' link when viewing connected tab", async () => {
    const user = userEvent.setup();
    const connectedMatch = {
      _id: "match1",
      users: [mockUser, otherUser],
      score: 75,
      sharedLanguages: ["Spanish"],
      status: "accepted",
      initiator: "user2",
    };

    // First call for initial pending tab fetch
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ matches: [] });

    renderMatches();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Connected" })).toBeInTheDocument();
    });

    // Mock for the connected tab fetch
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ matches: [connectedMatch] });

    // Click the Connected tab
    await user.click(screen.getByRole("button", { name: "Connected" }));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/matches?status=accepted");
    });

    await waitFor(() => {
      expect(screen.getByText("Send Message")).toBeInTheDocument();
    });
  });
});
