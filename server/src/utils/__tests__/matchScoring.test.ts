import { computeMatchScore } from "../../utils/matchScoring";

// Helper to create a mock user with the fields matchScoring cares about
function mockUser(
  knownLanguages: { language: string; proficiency: string }[],
  learningLanguages: { language: string; proficiency: string }[],
  interests: string[] = []
) {
  return { knownLanguages, learningLanguages, interests } as any;
}

describe("computeMatchScore", () => {
  it("returns score 0 and empty sharedLanguages when there is no overlap", () => {
    const userA = mockUser(
      [{ language: "English", proficiency: "native" }],
      [{ language: "French", proficiency: "beginner" }]
    );
    const userB = mockUser(
      [{ language: "Japanese", proficiency: "native" }],
      [{ language: "Korean", proficiency: "beginner" }]
    );

    const result = computeMatchScore(userA, userB);
    expect(result.score).toBe(0);
    expect(result.sharedLanguages).toEqual([]);
  });

  it("scores a basic one-directional match (A knows, B learns)", () => {
    // A knows English at native (index 4), B learning English at beginner (index 0)
    // gap = 4, score = 20 + 4*10 = 60
    const userA = mockUser(
      [{ language: "English", proficiency: "native" }],
      [{ language: "French", proficiency: "beginner" }]
    );
    const userB = mockUser(
      [{ language: "Spanish", proficiency: "native" }],
      [{ language: "English", proficiency: "beginner" }]
    );

    const result = computeMatchScore(userA, userB);
    expect(result.score).toBe(60);
    expect(result.sharedLanguages).toContain("English");
  });

  it("awards higher score for a larger proficiency gap", () => {
    // gap=1: advanced(2) - intermediate(1) => score = 20 + 1*10 = 30
    const userSmallGap = mockUser([{ language: "Spanish", proficiency: "advanced" }], []);
    const learnerSmallGap = mockUser([], [{ language: "Spanish", proficiency: "intermediate" }]);

    // gap=3: native(4) - intermediate(1) => score = 20 + 3*10 = 50
    const userLargeGap = mockUser([{ language: "Spanish", proficiency: "native" }], []);
    const learnerLargeGap = mockUser([], [{ language: "Spanish", proficiency: "intermediate" }]);

    const smallResult = computeMatchScore(userSmallGap, learnerSmallGap);
    const largeResult = computeMatchScore(userLargeGap, learnerLargeGap);

    expect(largeResult.score).toBeGreaterThan(smallResult.score);
    expect(smallResult.score).toBe(30);
    expect(largeResult.score).toBe(50);
  });

  it("adds a mutual exchange bonus when both users can teach each other", () => {
    // A knows English native(4), B learning English beginner(0) => gap=4, score += 60
    // B knows French native(4), A learning French beginner(0) => gap=4, score += 60 + 15 mutual
    const userA = mockUser(
      [{ language: "English", proficiency: "native" }],
      [{ language: "French", proficiency: "beginner" }]
    );
    const userB = mockUser(
      [{ language: "French", proficiency: "native" }],
      [{ language: "English", proficiency: "beginner" }]
    );

    const result = computeMatchScore(userA, userB);
    // first direction: 20 + 4*10 = 60
    // second direction (mutual): 20 + 4*10 + 15 = 75
    expect(result.score).toBe(60 + 75);
    expect(result.sharedLanguages).toContain("English");
    expect(result.sharedLanguages).toContain("French");
  });

  it("adds 5 points for each shared interest", () => {
    const userA = mockUser([], [], ["music", "cooking", "travel"]);
    const userB = mockUser([], [], ["music", "travel", "gaming"]);

    const result = computeMatchScore(userA, userB);
    // Two shared interests: music and travel => 2 * 5 = 10
    expect(result.score).toBe(10);
  });

  it("matches languages and interests case-insensitively", () => {
    const userA = mockUser(
      [{ language: "ENGLISH", proficiency: "native" }],
      [],
      ["Music", "TRAVEL"]
    );
    const userB = mockUser(
      [],
      [{ language: "english", proficiency: "beginner" }],
      ["music", "travel"]
    );

    const result = computeMatchScore(userA, userB);
    // Language gap: native(4) - beginner(0) = 4 => 20 + 40 = 60
    // Interests: 2 shared => 10
    expect(result.score).toBe(70);
    expect(result.sharedLanguages).toContain("ENGLISH");
  });

  it("returns score 0 when proficiency gap is zero or negative", () => {
    // A knows English at beginner(0), B learning English at beginner(0) => gap=0
    const userA = mockUser([{ language: "English", proficiency: "beginner" }], []);
    const userB = mockUser([], [{ language: "English", proficiency: "beginner" }]);

    const result = computeMatchScore(userA, userB);
    expect(result.score).toBe(0);
    expect(result.sharedLanguages).toEqual([]);

    // Negative gap: A knows at beginner(0), B learning at advanced(2) => gap = -2
    const userC = mockUser([{ language: "Spanish", proficiency: "beginner" }], []);
    const userD = mockUser([], [{ language: "Spanish", proficiency: "advanced" }]);

    const result2 = computeMatchScore(userC, userD);
    expect(result2.score).toBe(0);
  });

  it("handles empty language and interest arrays gracefully", () => {
    const userA = mockUser([], [], []);
    const userB = mockUser([], [], []);

    const result = computeMatchScore(userA, userB);
    expect(result.score).toBe(0);
    expect(result.sharedLanguages).toEqual([]);
  });
});
