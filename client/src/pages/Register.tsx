import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LANGUAGES, PROFICIENCY_LEVELS, INTEREST_OPTIONS } from "../utils/languages";
import { ArrowRight, ArrowLeft, Plus, X, Check } from "lucide-react";
import styles from "./Register.module.css";

interface LangEntry {
  language: string;
  proficiency: string;
}

const greetings = [
  { text: "Welcome", lang: "English" },
  { text: "Bienvenido", lang: "Spanish" },
  { text: "Bienvenue", lang: "French" },
  { text: "Willkommen", lang: "German" },
  { text: "Benvenuto", lang: "Italian" },
  { text: "Добро пожаловать", lang: "Russian" },
  { text: "歡迎", lang: "Chinese" },
  { text: "ようこそ", lang: "Japanese" },
  { text: "환영합니다", lang: "Korean" },
  { text: "أهلا بك", lang: "Arabic" },
  { text: "Bem-vindo", lang: "Portuguese" },
  { text: "स्वागत है", lang: "Hindi" },
];

export default function Register() {
  const { register, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [knownLanguages, setKnownLanguages] = useState<LangEntry[]>([
    { language: "", proficiency: "" },
  ]);
  const [learningLanguages, setLearningLanguages] = useState<LangEntry[]>([
    { language: "", proficiency: "" },
  ]);

  const [bio, setBio] = useState("");
  const [major, setMajor] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [role, setRole] = useState("both");
  const [interests, setInterests] = useState<string[]>([]);

  const totalSteps = 3;

  const addLanguage = (list: LangEntry[], setList: (v: LangEntry[]) => void) => {
    setList([...list, { language: "", proficiency: "" }]);
  };

  const removeLanguage = (index: number, list: LangEntry[], setList: (v: LangEntry[]) => void) => {
    setList(list.filter((_, i) => i !== index));
  };

  const updateLanguage = (
    index: number,
    field: "language" | "proficiency",
    value: string,
    list: LangEntry[],
    setList: (v: LangEntry[]) => void
  ) => {
    const updated = [...list];
    updated[index] = { ...updated[index], [field]: value };
    setList(updated);
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const validateStep1 = () => {
    if (!firstName.trim() || !lastName.trim()) return "Name is required";
    if (!email.trim()) return "Email is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  };

  const validateStep2 = () => {
    const validKnown = knownLanguages.filter((l) => l.language && l.proficiency);
    if (validKnown.length === 0) return "Add at least one language you know";
    return null;
  };

  const handleNext = () => {
    setError("");
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        return;
      }
    }
    if (step === 2) {
      const err = validateStep2();
      if (err) {
        setError(err);
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register({ email, password, firstName, lastName });

      const validKnown = knownLanguages.filter((l) => l.language && l.proficiency);
      const validLearning = learningLanguages.filter((l) => l.language && l.proficiency);

      await updateUser({
        knownLanguages: validKnown,
        learningLanguages: validLearning,
        bio,
        major,
        yearOfStudy,
        role,
        interests,
      } as Record<string, unknown> as Parameters<typeof updateUser>[0]);

      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.floatingGreetings}>
          {greetings.map((g, i) => (
            <span key={i} className={styles.greeting} style={{ animationDelay: `${i * 0.5}s` }}>
              {g.text}
            </span>
          ))}
        </div>
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Join LingoLinked</h1>
            <p className={styles.heroSubtitle}>
              Create your profile, get matched with conversation partners, and start practicing
              languages with the RPI community.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.formContainer}>
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}>L</div>
            <span className={styles.logoText}>LingoLinked</span>
          </div>

          {/* Progress stepper */}
          <div className={styles.progress}>
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className={styles.progressStep}>
                <div
                  className={`${styles.progressCircle} ${i + 1 <= step ? styles.progressActive : ""} ${i + 1 < step ? styles.progressComplete : ""}`}
                >
                  {i + 1 < step ? <Check size={14} /> : i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div
                    className={`${styles.progressLine} ${i + 1 < step ? styles.progressLineActive : ""}`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className={styles.stepLabel}>
            Step {step} of {totalSteps}:{" "}
            {step === 1 ? "Account Details" : step === 2 ? "Languages" : "Your Profile"}
          </p>

          {error && (
            <div className={styles.error} aria-live="polite">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            {step === 1 && (
              <>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>First Name</label>
                    <input
                      className={styles.input}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Last Name</label>
                    <input
                      className={styles.input}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Email</label>
                  <input
                    className={styles.input}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@rpi.edu"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Password</label>
                  <input
                    className={styles.input}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Confirm Password</label>
                  <input
                    className={styles.input}
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className={styles.langSection}>
                  <h3 className={styles.langTitle}>Languages I Know</h3>
                  {knownLanguages.map((entry, i) => (
                    <div key={i} className={styles.langRow}>
                      <select
                        className={styles.select}
                        value={entry.language}
                        onChange={(e) =>
                          updateLanguage(
                            i,
                            "language",
                            e.target.value,
                            knownLanguages,
                            setKnownLanguages
                          )
                        }
                      >
                        <option value="">Select language</option>
                        {LANGUAGES.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                      <select
                        className={styles.select}
                        value={entry.proficiency}
                        onChange={(e) =>
                          updateLanguage(
                            i,
                            "proficiency",
                            e.target.value,
                            knownLanguages,
                            setKnownLanguages
                          )
                        }
                      >
                        <option value="">Proficiency</option>
                        {PROFICIENCY_LEVELS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                      {knownLanguages.length > 1 && (
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => removeLanguage(i, knownLanguages, setKnownLanguages)}
                          aria-label="Remove language"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className={styles.addBtn}
                    onClick={() => addLanguage(knownLanguages, setKnownLanguages)}
                  >
                    <Plus size={16} /> Add Language
                  </button>
                </div>

                <div className={styles.langSection}>
                  <h3 className={styles.langTitle}>Languages I Want to Learn</h3>
                  {learningLanguages.map((entry, i) => (
                    <div key={i} className={styles.langRow}>
                      <select
                        className={styles.select}
                        value={entry.language}
                        onChange={(e) =>
                          updateLanguage(
                            i,
                            "language",
                            e.target.value,
                            learningLanguages,
                            setLearningLanguages
                          )
                        }
                      >
                        <option value="">Select language</option>
                        {LANGUAGES.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                      <select
                        className={styles.select}
                        value={entry.proficiency}
                        onChange={(e) =>
                          updateLanguage(
                            i,
                            "proficiency",
                            e.target.value,
                            learningLanguages,
                            setLearningLanguages
                          )
                        }
                      >
                        <option value="">Current level</option>
                        {PROFICIENCY_LEVELS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                      {learningLanguages.length > 1 && (
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => removeLanguage(i, learningLanguages, setLearningLanguages)}
                          aria-label="Remove language"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className={styles.addBtn}
                    onClick={() => addLanguage(learningLanguages, setLearningLanguages)}
                  >
                    <Plus size={16} /> Add Language
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className={styles.field}>
                  <label className={styles.label}>Bio</label>
                  <textarea
                    className={styles.textarea}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell others about yourself and your language goals..."
                    maxLength={500}
                    rows={3}
                  />
                  <span className={styles.charCount}>{bio.length}/500</span>
                </div>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Major</label>
                    <input
                      className={styles.input}
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      placeholder="e.g. Computer Science"
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Year</label>
                    <select
                      className={styles.select}
                      value={yearOfStudy}
                      onChange={(e) => setYearOfStudy(e.target.value)}
                    >
                      <option value="">Select year</option>
                      <option value="Freshman">Freshman</option>
                      <option value="Sophomore">Sophomore</option>
                      <option value="Junior">Junior</option>
                      <option value="Senior">Senior</option>
                      <option value="Graduate">Graduate</option>
                    </select>
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>I want to</label>
                  <div className={styles.roleOptions}>
                    {[
                      { value: "learner", label: "Learn a language" },
                      { value: "tutor", label: "Help others learn" },
                      { value: "both", label: "Both" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`${styles.roleBtn} ${role === opt.value ? styles.roleBtnActive : ""}`}
                        onClick={() => setRole(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Interests</label>
                  <div className={styles.interestGrid}>
                    {INTEREST_OPTIONS.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        className={`${styles.interestTag} ${interests.includes(interest) ? styles.interestActive : ""}`}
                        onClick={() => toggleInterest(interest)}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className={styles.actions}>
              {step > 1 && (
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={() => setStep((s) => s - 1)}
                >
                  <ArrowLeft size={16} /> Back
                </button>
              )}
              {step < totalSteps ? (
                <button type="button" className={styles.nextBtn} onClick={handleNext}>
                  Continue <ArrowRight size={16} />
                </button>
              ) : (
                <button type="submit" className={styles.nextBtn} disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              )}
            </div>
          </form>

          <p className={styles.footer}>
            Already have an account?{" "}
            <Link to="/login" className={styles.link}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}