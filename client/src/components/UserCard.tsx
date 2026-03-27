import { Star } from "lucide-react";
import LanguageBadge from "./LanguageBadge";
import styles from "./UserCard.module.css";

interface Language {
  language: string;
  proficiency: string;
}

interface Props {
  firstName: string;
  lastName: string;
  bio: string;
  profilePicture?: string;
  knownLanguages: Language[];
  learningLanguages: Language[];
  score?: number;
  sharedLanguages?: string[];
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}

export default function UserCard({
  firstName,
  lastName,
  bio,
  profilePicture,
  knownLanguages,
  learningLanguages,
  score,
  sharedLanguages,
  actionLabel,
  onAction,
  actionDisabled,
}: Props) {
  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();

  return (
    <div className={styles.card} role="article" aria-label={`${firstName} ${lastName}`}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          {profilePicture ? <img src={profilePicture} alt={firstName} /> : <span>{initials}</span>}
        </div>
        <div className={styles.info}>
          <h3 className={styles.name}>
            {firstName} {lastName}
          </h3>
          {score !== undefined && (
            <span className={styles.score}>
              <Star size={14} />
              {score}% match
            </span>
          )}
        </div>
      </div>

      {bio && <p className={styles.bio}>{bio}</p>}

      {sharedLanguages && sharedLanguages.length > 0 && (
        <div className={styles.shared}>{sharedLanguages.join(", ")}</div>
      )}

      <div className={styles.languages}>
        {knownLanguages.length > 0 && (
          <div className={styles.langSection}>
            <span className={styles.langLabel}>Speaks</span>
            <div className={styles.badges}>
              {knownLanguages.map((l) => (
                <LanguageBadge
                  key={l.language}
                  language={l.language}
                  proficiency={l.proficiency}
                  variant="known"
                />
              ))}
            </div>
          </div>
        )}
        {learningLanguages.length > 0 && (
          <div className={styles.langSection}>
            <span className={styles.langLabel}>Learning</span>
            <div className={styles.badges}>
              {learningLanguages.map((l) => (
                <LanguageBadge
                  key={l.language}
                  language={l.language}
                  proficiency={l.proficiency}
                  variant="learning"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {actionLabel && onAction && (
        <button className={styles.actionBtn} onClick={onAction} disabled={actionDisabled}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

