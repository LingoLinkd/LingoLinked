import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LanguageBadge from "../LanguageBadge";

describe("LanguageBadge", () => {
  it("renders language and proficiency", () => {
    render(<LanguageBadge language="Spanish" proficiency="intermediate" />);
    expect(screen.getByText("Spanish")).toBeInTheDocument();
    expect(screen.getByText("intermediate")).toBeInTheDocument();
  });

  it("applies the known variant class by default", () => {
    const { container } = render(<LanguageBadge language="French" proficiency="native" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("known");
  });

  it("applies the learning variant class when specified", () => {
    const { container } = render(
      <LanguageBadge language="Japanese" proficiency="beginner" variant="learning" />
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("learning");
  });
});
