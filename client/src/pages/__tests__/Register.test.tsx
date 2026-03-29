import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Register from "../Register";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));
import { useAuth } from "../../context/AuthContext";

const mockRegister = vi.fn();
const mockUpdateUser = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    user: null,
    token: null,
    loading: false,
    login: vi.fn(),
    register: mockRegister,
    logout: vi.fn(),
    updateUser: mockUpdateUser,
    refreshUser: vi.fn(),
  });
});

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );
}

describe("Register page", () => {
  it("renders step 1 with account detail fields", () => {
    renderRegister();

    expect(screen.getByText("Step 1 of 3: Account Details")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("First name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Last name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@rpi.edu")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("At least 8 characters")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirm your password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
  });

  it("shows error when first or last name is empty on step 1", async () => {
    const user = userEvent.setup();
    renderRegister();

    // Fill email and password but leave names empty
    await user.type(screen.getByPlaceholderText("you@rpi.edu"), "test@rpi.edu");
    await user.type(screen.getByPlaceholderText("At least 8 characters"), "password123");
    await user.type(screen.getByPlaceholderText("Confirm your password"), "password123");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Name is required")).toBeInTheDocument();
  });

  it("shows error when password is shorter than 8 characters", async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByPlaceholderText("First name"), "Test");
    await user.type(screen.getByPlaceholderText("Last name"), "User");
    await user.type(screen.getByPlaceholderText("you@rpi.edu"), "test@rpi.edu");
    await user.type(screen.getByPlaceholderText("At least 8 characters"), "short");
    await user.type(screen.getByPlaceholderText("Confirm your password"), "short");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
  });

  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByPlaceholderText("First name"), "Test");
    await user.type(screen.getByPlaceholderText("Last name"), "User");
    await user.type(screen.getByPlaceholderText("you@rpi.edu"), "test@rpi.edu");
    await user.type(screen.getByPlaceholderText("At least 8 characters"), "password123");
    await user.type(screen.getByPlaceholderText("Confirm your password"), "different123");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
  });

  it("advances to step 2 when step 1 is valid", async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByPlaceholderText("First name"), "Test");
    await user.type(screen.getByPlaceholderText("Last name"), "User");
    await user.type(screen.getByPlaceholderText("you@rpi.edu"), "test@rpi.edu");
    await user.type(screen.getByPlaceholderText("At least 8 characters"), "password123");
    await user.type(screen.getByPlaceholderText("Confirm your password"), "password123");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Step 2 of 3: Languages")).toBeInTheDocument();
    expect(screen.getByText("Languages I Know")).toBeInTheDocument();
  });

  it("shows error on step 2 if no known language is filled in", async () => {
    const user = userEvent.setup();
    renderRegister();

    // Fill step 1 and advance
    await user.type(screen.getByPlaceholderText("First name"), "Test");
    await user.type(screen.getByPlaceholderText("Last name"), "User");
    await user.type(screen.getByPlaceholderText("you@rpi.edu"), "test@rpi.edu");
    await user.type(screen.getByPlaceholderText("At least 8 characters"), "password123");
    await user.type(screen.getByPlaceholderText("Confirm your password"), "password123");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Try to advance from step 2 without selecting languages
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Add at least one language you know")).toBeInTheDocument();
  });

  it("can add another language row on step 2 with Add Language button", async () => {
    const user = userEvent.setup();
    renderRegister();

    // Advance to step 2
    await user.type(screen.getByPlaceholderText("First name"), "Test");
    await user.type(screen.getByPlaceholderText("Last name"), "User");
    await user.type(screen.getByPlaceholderText("you@rpi.edu"), "test@rpi.edu");
    await user.type(screen.getByPlaceholderText("At least 8 characters"), "password123");
    await user.type(screen.getByPlaceholderText("Confirm your password"), "password123");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // There are two "+ Add Language" buttons (one for known, one for learning)
    const addButtons = screen.getAllByText("+ Add Language");
    expect(addButtons).toHaveLength(2);

    // Click the first one (known languages) to add another row
    await user.click(addButtons[0]);

    // There should now be two "Select language" dropdowns for known languages
    const selectLanguageOptions = screen.getAllByDisplayValue("Select language");
    // Initially: 1 known + 1 learning = 2, after add: 2 known + 1 learning = 3
    expect(selectLanguageOptions.length).toBeGreaterThanOrEqual(3);
  });

  it("calls register and updateUser on step 3 submit, then navigates", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce(undefined);
    mockUpdateUser.mockResolvedValueOnce(undefined);
    renderRegister();

    // Step 1
    await user.type(screen.getByPlaceholderText("First name"), "Test");
    await user.type(screen.getByPlaceholderText("Last name"), "User");
    await user.type(screen.getByPlaceholderText("you@rpi.edu"), "test@rpi.edu");
    await user.type(screen.getByPlaceholderText("At least 8 characters"), "password123");
    await user.type(screen.getByPlaceholderText("Confirm your password"), "password123");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Step 2 - select a known language and proficiency
    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "English");
    await user.selectOptions(selects[1], "native");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Step 3
    expect(screen.getByText("Step 3 of 3: Your Profile")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: "test@rpi.edu",
        password: "password123",
        firstName: "Test",
        lastName: "User",
      });
    });

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });
});
