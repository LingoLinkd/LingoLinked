import { useCallback, useEffect, useState } from "react";
import { useAuth, type User } from "../context/AuthContext";
import { api } from "../utils/api";
import Navbar from "../components/Navbar";
import UserCard from "../components/UserCard";
import { Clock, UserCheck, Check, XCircle, MessageSquare, Send, Inbox } from "lucide-react";
import styles from "./Matches.module.css";

interface Match {
  _id: string;
  users: User[];
  score: number;
  sharedLanguages: string[];
  status: "pending" | "accepted" | "declined";
  initiator: string;
}

export default function Matches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [tab, setTab] = useState<"pending" | "accepted">("pending");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMatches = useCallback(() => {
    setLoading(true);
    api
      .get<{ matches: Match[] }>(`/matches?status=${tab}`)
      .then(({ matches }) => setMatches(matches))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleAccept = async (matchId: string) => {
    setActionLoading(matchId);
    try {
      await api.put(`/matches/${matchId}/accept`, {});
      fetchMatches();
    } catch (err) {
      console.error("Accept error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (matchId: string) => {
    setActionLoading(matchId);
    try {
      await api.put(`/matches/${matchId}/decline`, {});
      fetchMatches();
    } catch (err) {
      console.error("Decline error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const getOtherUser = (match: Match) => {
    return match.users.find((u) => u._id !== user?._id) || match.users[0];
  };

  const isIncoming = (match: Match) => match.initiator !== user?._id;

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Your Matches</h1>

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === "pending" ? styles.tabActive : ""}`}
              onClick={() => setTab("pending")}
            >
              <Clock size={16} />
              Pending
            </button>
            <button
              className={`${styles.tab} ${tab === "accepted" ? styles.tabActive : ""}`}
              onClick={() => setTab("accepted")}
            >
              <UserCheck size={16} />
              Connected
            </button>
          </div>

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
                </div>
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div className={styles.empty}>
              <Inbox size={48} />
              <p className={styles.emptyTitle}>
                {tab === "pending" ? "No pending requests" : "No connections yet"}
              </p>
              <p className={styles.emptyText}>
                {tab === "pending"
                  ? "Check the dashboard for suggested partners and send connection requests."
                  : "Accept pending requests or find new partners on the dashboard."}
              </p>
            </div>
          ) : (
            <div className={styles.grid}>
              {matches.map((match) => {
                const other = getOtherUser(match);
                const incoming = isIncoming(match);

                return (
                  <div key={match._id} className={styles.matchCard}>
                    <UserCard
                      firstName={other.firstName}
                      lastName={other.lastName}
                      bio={other.bio}
                      profilePicture={other.profilePicture}
                      knownLanguages={other.knownLanguages}
                      learningLanguages={other.learningLanguages}
                      score={match.score}
                      sharedLanguages={match.sharedLanguages}
                    />
                    {tab === "pending" && incoming && (
                      <div className={styles.matchActions}>
                        <button
                          className={styles.acceptBtn}
                          onClick={() => handleAccept(match._id)}
                          disabled={actionLoading === match._id}
                        >
                          <Check size={16} />
                          Accept
                        </button>
                        <button
                          className={styles.declineBtn}
                          onClick={() => handleDecline(match._id)}
                          disabled={actionLoading === match._id}
                        >
                          <XCircle size={16} />
                          Decline
                        </button>
                      </div>
                    )}
                    {tab === "pending" && !incoming && (
                      <div className={styles.sentLabel}>
                        <Send size={14} />
                        Request sent
                      </div>
                    )}
                    {tab === "accepted" && (
                      <a href="/messages" className={styles.messageLink}>
                        <MessageSquare size={16} />
                        Send Message
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
