import { describe, it, expect } from "vitest";
import { LANGUAGES, PROFICIENCY_LEVELS, INTEREST_OPTIONS } from "../languages";

describe("languages constants", () => {
  it("should include common languages", () => {
    expect(LANGUAGES).toContain("English");
    expect(LANGUAGES).toContain("Spanish");
    expect(LANGUAGES).toContain("Chinese (Mandarin)");
  });

  it("should have 27 languages total", () => {
    expect(LANGUAGES).toHaveLength(27);
  });

  it("should have all five proficiency levels", () => {
    expect(PROFICIENCY_LEVELS).toHaveLength(5);
    const values = PROFICIENCY_LEVELS.map((p) => p.value);
    expect(values).toEqual(["beginner", "intermediate", "advanced", "fluent", "native"]);
  });

  it("should have interest options", () => {
    expect(INTEREST_OPTIONS.length).toBeGreaterThan(0);
    expect(INTEREST_OPTIONS).toContain("Cultural Exchange");
    expect(INTEREST_OPTIONS).toContain("Study Abroad");
  });

  it("should have unique language entries", () => {
    const unique = new Set(LANGUAGES);
    expect(unique.size).toBe(LANGUAGES.length);
  });
});
