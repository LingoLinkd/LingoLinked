import styles from "./LanguageBadge.module.css";

interface Props {
  language: string;
  proficiency: string;
  variant?: "known" | "learning";
}

export default function LanguageBadge({ language, proficiency, variant = "known" }: Props) {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      <span className={styles.lang}>{language}</span>
      <span className={styles.level}>{proficiency}</span>
    </span>
  );
}
