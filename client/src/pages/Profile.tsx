import { useState, type FormEvent, type ChangeEvent } from "react";
import { useAuth } from "../context/AuthContext";
import type { User } from "../context/AuthContext";
import { api } from "../utils/api";
import { LANGUAGES, PROFICIENCY_LEVELS, INTEREST_OPTIONS } from "../utils/languages";
import Navbar from "../components/Navbar";
import LanguageBadge from "../components/LanguageBadge";
import { Edit3, Save, XCircle, Plus, X, Camera } from "lucide-react";
import styles from "./Profile.module.css";

interface LangEntry {
  language: string;
  proficiency: string;
}

export default function Profile() {
  const { user, updateUser, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  // Editable fields
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [major, setMajor] = useState(user?.major || "");
  const [yearOfStudy, setYearOfStudy] = useState(user?.yearOfStudy || "");
  const [role, setRole] = useState(user?.role || "both");
  const [knownLanguages, setKnownLanguages] = useState<LangEntry[]>(
    user?.knownLanguages.length ? user.knownLanguages : [{ language: "", proficiency: "" }]
  );
  const [learningLanguages, setLearningLanguages] = useState<LangEntry[]>(
    user?.learningLanguages.length ? user.learningLanguages : [{ language: "", proficiency: "" }]
  );
  const [interests, setInterests] = useState<string[]>(user?.interests || []);
  const [accountStatus, setAccountStatus] = useState(user?.accountStatus || "active");

  const updateLang = (
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

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const validKnown = knownLanguages.filter((l) => l.language && l.proficiency);
      const validLearning = learningLanguages.filter((l) => l.language && l.proficiency);

      await updateUser({
        firstName,
        lastName,
        bio,
        major,
        yearOfStudy,
        role,
        knownLanguages: validKnown,
        learningLanguages: validLearning,
        interests,
        accountStatus,
      } as Parameters<typeof updateUser>[0]);

      setMessage("Profile updated");
      setEditing(false);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setFirstName(user?.firstName || "");
    setLastName(user?.lastName || "");
    setBio(user?.bio || "");
    setMajor(user?.major || "");
    setYearOfStudy(user?.yearOfStudy || "");
    setRole(user?.role || "both");
    setKnownLanguages(
      user?.knownLanguages.length ? user.knownLanguages : [{ language: "", proficiency: "" }]
    );
    setLearningLanguages(
      user?.learningLanguages.length ? user.learningLanguages : [{ language: "", proficiency: "" }]
    );
    setInterests(user?.interests || []);
    setAccountStatus(user?.accountStatus || "active");
    setEditing(false);
    setMessage("");
  };

  const handlePictureUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);
      await api.upload<{ user: User }>("/users/profile/picture", formData);
      await refreshUser();
      setMessage("Profile picture updated");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "";

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Your Profile</h1>
            {!editing && (
              <button className={styles.editBtn} onClick={() => setEditing(true)}>
                <Edit3 size={16} /> Edit Profile
              </button>
            )}
          </div>

          {message && <div className={styles.message}>{message}</div>}

          {editing ? (
            <form onSubmit={handleSave} className={styles.form}>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Basic Information</h3>
                <div className={styles.pictureUpload}>
                  <div className={styles.bigAvatar}>
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt={user.firstName} />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <label className={styles.uploadLabel} aria-label="Upload profile photo">
                    {uploading ? (
                      "Uploading..."
                    ) : (
                      <>
                        <Camera size={16} /> Change Photo
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePictureUpload}
                      className={styles.fileInput}
                      disabled={uploading}
                    />
                  </label>
                </div>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>First Name</label>
                    <input
                      className={styles.input}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Last Name</label>
                    <input
                      className={styles.input}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Bio</label>
                  <textarea
                    className={styles.textarea}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
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
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Year</label>
                    <select
                      className={styles.select}
                      value={yearOfStudy}
                      onChange={(e) => setYearOfStudy(e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="Freshman">Freshman</option>
                      <option value="Sophomore">Sophomore</option>
                      <option value="Junior">Junior</option>
                      <option value="Senior">Senior</option>
                      <option value="Graduate">Graduate</option>
                    </select>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Role</label>
                  <div className={styles.roleOptions}>
                    {[
                      { value: "learner", label: "Learner" },
                      { value: "tutor", label: "Tutor" },
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
                  <label className={styles.label}>Account Status</label>
                  <div className={styles.roleOptions}>
                    <button
                      type="button"
                      className={`${styles.roleBtn} ${accountStatus === "active" ? styles.roleBtnActive : ""}`}
                      onClick={() => setAccountStatus("active")}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      className={`${styles.roleBtn} ${accountStatus === "inactive" ? styles.roleBtnActive : ""}`}
                      onClick={() => setAccountStatus("inactive")}
                    >
                      Inactive
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Languages I Know</h3>
                {knownLanguages.map((entry, i) => (
                  <div key={i} className={styles.langRow}>
                    <select
                      className={styles.select}
                      value={entry.language}
                      onChange={(e) =>
                        updateLang(i, "language", e.target.value, knownLanguages, setKnownLanguages)
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
                        updateLang(
                          i,
                          "proficiency",
                          e.target.value,
                          knownLanguages,
                          setKnownLanguages
                        )
                      }
                    >
                      <option value="">Level</option>
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
                        onClick={() => setKnownLanguages(knownLanguages.filter((_, j) => j !== i))}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className={styles.addBtn}
                  onClick={() =>
                    setKnownLanguages([...knownLanguages, { language: "", proficiency: "" }])
                  }
                >
                  <Plus size={16} /> Add Language
                </button>
              </div>

              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Languages I'm Learning</h3>
                {learningLanguages.map((entry, i) => (
                  <div key={i} className={styles.langRow}>
                    <select
                      className={styles.select}
                      value={entry.language}
                      onChange={(e) =>
                        updateLang(
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
                        updateLang(
                          i,
                          "proficiency",
                          e.target.value,
                          learningLanguages,
                          setLearningLanguages
                        )
                      }
                    >
                      <option value="">Level</option>
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
                        onClick={() =>
                          setLearningLanguages(learningLanguages.filter((_, j) => j !== i))
                        }
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className={styles.addBtn}
                  onClick={() =>
                    setLearningLanguages([...learningLanguages, { language: "", proficiency: "" }])
                  }
                >
                  <Plus size={16} /> Add Language
                </button>
              </div>

              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Interests</h3>
                <div className={styles.interestGrid}>
                  {INTEREST_OPTIONS.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      className={`${styles.interestTag} ${interests.includes(interest) ? styles.interestActive : ""}`}
                      onClick={() =>
                        setInterests((prev) =>
                          prev.includes(interest)
                            ? prev.filter((i) => i !== interest)
                            : [...prev, interest]
                        )
                      }
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={cancelEdit}>
                  <XCircle size={16} /> Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save size={16} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* View mode */
            <div className={styles.viewMode}>
              <div className={styles.card}>
                <div className={styles.profileHeader}>
                  <div className={styles.bigAvatar}>
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt={user.firstName} />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div>
                    <h2 className={styles.profileName}>
                      {user?.firstName} {user?.lastName}
                    </h2>
                    <p className={styles.profileMeta}>
                      {user?.major && <span>{user.major}</span>}
                      {user?.yearOfStudy && <span> &middot; {user.yearOfStudy}</span>}
                    </p>
                    <p className={styles.profileMeta}>{user?.university}</p>
                    <span
                      className={`${styles.statusBadge} ${
                        user?.accountStatus === "active"
                          ? styles.statusActive
                          : styles.statusInactive
                      }`}
                    >
                      {user?.accountStatus}
                    </span>
                  </div>
                </div>
                {user?.bio && <p className={styles.profileBio}>{user.bio}</p>}
              </div>

              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Languages I Know</h3>
                <div className={styles.badgeList}>
                  {user?.knownLanguages.length ? (
                    user.knownLanguages.map((l) => (
                      <LanguageBadge
                        key={l.language}
                        language={l.language}
                        proficiency={l.proficiency}
                        variant="known"
                      />
                    ))
                  ) : (
                    <p className={styles.muted}>No languages added yet</p>
                  )}
                </div>
              </div>

              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Languages I'm Learning</h3>
                <div className={styles.badgeList}>
                  {user?.learningLanguages.length ? (
                    user.learningLanguages.map((l) => (
                      <LanguageBadge
                        key={l.language}
                        language={l.language}
                        proficiency={l.proficiency}
                        variant="learning"
                      />
                    ))
                  ) : (
                    <p className={styles.muted}>No languages added yet</p>
                  )}
                </div>
              </div>

              {user?.interests && user.interests.length > 0 && (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Interests</h3>
                  <div className={styles.interestGrid}>
                    {user.interests.map((interest) => (
                      <span key={interest} className={styles.interestViewTag}>
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}