import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Events from "../Events";

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

const mockEvent = {
  _id: "event1",
  title: "Spanish Practice",
  description: "Weekly practice session",
  date: "2026-06-15T00:00:00.000Z",
  time: "14:00",
  location: "DCC 308",
  language: "Spanish",
  maxAttendees: 10,
  organizer: { _id: "organizer1", firstName: "Jane", lastName: "Doe", profilePicture: "" },
  attendees: [{ _id: "organizer1", firstName: "Jane", lastName: "Doe", profilePicture: "" }],
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
  (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ events: [] });
});

function renderEvents() {
  return render(
    <MemoryRouter>
      <Events />
    </MemoryRouter>
  );
}

describe("Events page", () => {
  it("fetches and renders event cards with title, description, date, and location", async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ events: [mockEvent] });
    renderEvents();

    await waitFor(() => {
      expect(screen.getByText("Spanish Practice")).toBeInTheDocument();
      expect(screen.getByText("Weekly practice session")).toBeInTheDocument();
      expect(screen.getByText("DCC 308")).toBeInTheDocument();
      expect(screen.getByText("14:00")).toBeInTheDocument();
    });

    expect(api.get).toHaveBeenCalledWith("/events");
  });

  it("shows Register button when user is NOT in attendees", async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ events: [mockEvent] });
    renderEvents();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Register" })).toBeInTheDocument();
    });
  });

  it("shows Unregister button when user IS in attendees but not organizer", async () => {
    const eventWithUser = {
      ...mockEvent,
      attendees: [
        { _id: "organizer1", firstName: "Jane", lastName: "Doe", profilePicture: "" },
        { _id: "user1", firstName: "Test", lastName: "User", profilePicture: "" },
      ],
    };
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ events: [eventWithUser] });
    renderEvents();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Unregister" })).toBeInTheDocument();
    });
  });

  it("shows 'You are the organizer' badge when user is the organizer", async () => {
    const eventAsOrganizer = {
      ...mockEvent,
      organizer: { _id: "user1", firstName: "Test", lastName: "User", profilePicture: "" },
      attendees: [{ _id: "user1", firstName: "Test", lastName: "User", profilePicture: "" }],
    };
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ events: [eventAsOrganizer] });
    renderEvents();

    await waitFor(() => {
      expect(screen.getByText("You are the organizer")).toBeInTheDocument();
    });

    // Should NOT show Register/Unregister buttons
    expect(screen.queryByRole("button", { name: "Register" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Unregister" })).not.toBeInTheDocument();
  });

  it("shows 'Event Full' when maxAttendees is reached", async () => {
    const fullEvent = {
      ...mockEvent,
      maxAttendees: 1,
      attendees: [{ _id: "organizer1", firstName: "Jane", lastName: "Doe", profilePicture: "" }],
    };
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ events: [fullEvent] });
    renderEvents();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Event Full" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Event Full" })).toBeDisabled();
    });
  });
});
