import { useEffect, useState } from "react";
import { useAuth, type User } from "../context/AuthContext";
import { api } from "../utils/api";
import UserCard from "../components/UserCard";
import Navbar from "../components/Navbar";
import { BookOpen, GraduationCap, Users, AlertCircle, Sparkles } from "lucide-react";
import styles from "./Dashboard.module.css";

interface Suggestion {
  user: User;
  score: number;
  sharedLanguages: string[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    api
      .get<{ suggestions: Suggestion[] }>("/matches/suggestions")
      .then(({ suggestions }) => setSuggestions(suggestions))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleConnect = async (userId: string) => {
    setConnectingId(userId);
    try {
      await api.post(`/matches/${userId}/connect`, {});
      setConnectedIds((prev) => new Set([...prev, userId]));
    } catch (err) {
      console.error("Connect error:", err);
    } finally {
      setConnectingId(null);
    }
  };

  const profileComplete = user && user.knownLanguages.length > 0 && user.bio;

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Welcome banner */}
          <section className={styles.welcome}>
            <div className={styles.welcomeContent}>
              <h1 className={styles.welcomeTitle}>Welcome back, {user?.firstName}</h1>
              <p className={styles.welcomeSubtitle}>
                Discover language partners matched to your goals
              </p>
            </div>
            <div className={styles.welcomeDecor}>
              <Sparkles size={48} />
            </div>
          </section>

          {/* Profile completeness nudge */}
          {!profileComplete && (
            <div className={styles.nudge}>
              <div className={styles.nudgeContent}>
                <AlertCircle size={18} />
                <span>
                  <strong>Complete your profile</strong> to get better matches. Add your languages,
                  bio, and interests.
                </span>
              </div>
              <a href="/profile" className={styles.nudgeLink}>
                Edit Profile
              </a>
            </div>
          )}

          {/* Quick stats */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <BookOpen size={22} />
              </div>
              <span className={styles.statValue}>{user?.knownLanguages.length || 0}</span>
              <span className={styles.statLabel}>Languages Known</span>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <GraduationCap size={22} />
              </div>
              <span className={styles.statValue}>{user?.learningLanguages.length || 0}</span>
              <span className={styles.statLabel}>Learning</span>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Users size={22} />
              </div>
              <span className={styles.statValue}>{suggestions.length}</span>
              <span className={styles.statLabel}>Matches Found</span>
            </div>
          </div>

          {/* Suggestions */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Suggested Partners</h2>
            {loading ? (
              <div className={styles.grid}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className={styles.skeleton}>
                    <div className={styles.skeletonHeader}>
                      <div className={styles.skeletonAvatar} />
                      <div className={styles.skeletonLines}>
                        <div className={styles.skeletonLine} style={{ width: "60%" }} />
                        <div className={styles.skeletonLine} style={{ width: "40%" }} />
                      </div>
                    </div>
                    <div className={styles.skeletonLine} style={{ width: "100%" }} />
                    <div className={styles.skeletonLine} style={{ width: "80%" }} />
                    <div className={styles.skeletonLine} style={{ width: "50%", height: "36px" }} />
                  </div>
                ))}
              </div>
            ) : suggestions.length === 0 ? (
              <div className={styles.empty}>
                <p className={styles.emptyTitle}>No matches yet</p>
                <p className={styles.emptyText}>
                  Make sure your language profile is complete so we can find compatible conversation
                  partners.
                </p>
              </div>
            ) : (
              <div className={styles.grid}>
                {suggestions.map(({ user: match, score, sharedLanguages }) => (
                  <UserCard
                    key={match._id}
                    firstName={match.firstName}
                    lastName={match.lastName}
                    bio={match.bio}
                    profilePicture={match.profilePicture}
                    knownLanguages={match.knownLanguages}
                    learningLanguages={match.learningLanguages}
                    score={score}
                    sharedLanguages={sharedLanguages}
                    actionLabel={connectedIds.has(match._id) ? "Request Sent" : "Connect"}
                    onAction={() => handleConnect(match._id)}
                    actionDisabled={connectingId === match._id || connectedIds.has(match._id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}