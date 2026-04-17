import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserCard from "../UserCard";

// default props shared across most usercard tests
const defaultProps = {
  firstName: "Alice",
  lastName: "Smith",
  bio: "I love learning languages",
  knownLanguages: [{ language: "English", proficiency: "native" }],
  learningLanguages: [{ language: "Spanish", proficiency: "beginner" }],
};

// tests for usercard rendering avatar languages score and action button
describe("UserCard", () => {
  it("renders user name and bio", () => {
    render(<UserCard {...defaultProps} />);

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("I love learning languages")).toBeInTheDocument();
  });

  it("displays initials when no profile picture is provided", () => {
    render(<UserCard {...defaultProps} />);

    expect(screen.getByText("AS")).toBeInTheDocument();
  });

  it("displays profile picture when provided", () => {
    render(<UserCard {...defaultProps} profilePicture="/uploads/alice.jpg" />);

    const img = screen.getByAltText("Alice");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/uploads/alice.jpg");
  });

  it("displays match score when provided", () => {
    render(<UserCard {...defaultProps} score={85} />);

    expect(screen.getByText("85% match")).toBeInTheDocument();
  });

  it("displays shared languages when provided", () => {
    render(<UserCard {...defaultProps} sharedLanguages={["Spanish", "French"]} />);

    expect(screen.getByText("Spanish, French")).toBeInTheDocument();
  });

  it("renders language badges for known and learning languages", () => {
    render(<UserCard {...defaultProps} />);

    expect(screen.getByText("Speaks")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Learning")).toBeInTheDocument();
    expect(screen.getByText("Spanish")).toBeInTheDocument();
  });

  it("renders action button and calls onAction when clicked", async () => {
    const user = userEvent.setup();
    const handleAction = vi.fn();
    render(<UserCard {...defaultProps} actionLabel="Connect" onAction={handleAction} />);

    const button = screen.getByRole("button", { name: "Connect" });
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it("disables action button when actionDisabled is true", () => {
    render(
      <UserCard {...defaultProps} actionLabel="Connect" onAction={vi.fn()} actionDisabled={true} />
    );

    const button = screen.getByRole("button", { name: "Connect" });
    expect(button).toBeDisabled();
  });
});
