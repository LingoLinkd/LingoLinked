import { IUser } from "../models/User";

/**
 * Matching algorithm: scores two users based on language compatibility.
 *
 * High score = good match. Factors:
 * 1. Complementary pairs: User A knows a language User B wants to learn (and vice versa)
 * 2. Proficiency gap: A larger gap between the teacher's level and learner's level is better
 * 3. Mutual exchange: Both users can teach each other something
 * 4. Shared interests bonus
 */
export function computeMatchScore(
  userA: IUser,
  userB: IUser
): { score: number; sharedLanguages: string[] } {
  let score = 0;
  const sharedLanguages: string[] = [];

  // Check if A knows languages that B wants to learn
  for (const known of userA.knownLanguages) {
    for (const learning of userB.learningLanguages) {
      if (known.language.toLowerCase() === learning.language.toLowerCase()) {
        const profLevels = ["beginner", "intermediate", "advanced", "fluent", "native"];
        const knownLevel = profLevels.indexOf(known.proficiency);
        const learningLevel = profLevels.indexOf(learning.proficiency);
        const gap = knownLevel - learningLevel;

        if (gap > 0) {
          // The teacher is more proficient than the learner - good match
          score += 20 + gap * 10;
          if (!sharedLanguages.includes(known.language)) {
            sharedLanguages.push(known.language);
          }
        }
      }
    }
  }

  // Check if B knows languages that A wants to learn (mutual exchange)
  for (const known of userB.knownLanguages) {
    for (const learning of userA.learningLanguages) {
      if (known.language.toLowerCase() === learning.language.toLowerCase()) {
        const profLevels = ["beginner", "intermediate", "advanced", "fluent", "native"];
        const knownLevel = profLevels.indexOf(known.proficiency);
        const learningLevel = profLevels.indexOf(learning.proficiency);
        const gap = knownLevel - learningLevel;

        if (gap > 0) {
          score += 20 + gap * 10;
          // Bonus for mutual exchange
          score += 15;
          if (!sharedLanguages.includes(known.language)) {
            sharedLanguages.push(known.language);
          }
        }
      }
    }
  }

  // Shared interests bonus
  const aInterests = new Set(userA.interests.map((i) => i.toLowerCase()));
  for (const interest of userB.interests) {
    if (aInterests.has(interest.toLowerCase())) {
      score += 5;
    }
  }

  return { score, sharedLanguages };
}
