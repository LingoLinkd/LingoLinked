import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Home, Users, MessageSquare, CalendarDays, LogOut } from "lucide-react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  //Logs out the user and redirects to the login page
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  //Derive two-letter avatar initials from first and last name
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "";

  //Return navbar
  return (
    <nav className={styles.navbar} aria-label="Main navigation">
      <div className={styles.inner}>
        <NavLink to="/dashboard" className={styles.logo}>
          <span className={styles.logoIcon}>L</span>
          <span className={styles.logoText}>LingoLinked</span>
        </NavLink>

        <div className={styles.links}>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`}
          >
            <Home size={18} />
            Home
          </NavLink>
          <NavLink
            to="/matches"
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`}
          >
            <Users size={18} />
            Matches
          </NavLink>
          <NavLink
            to="/messages"
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`}
          >
            <MessageSquare size={18} />
            Messages
          </NavLink>
          <NavLink
            to="/events"
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`}
          >
            <CalendarDays size={18} />
            Events
          </NavLink>
        </div>

        <div className={styles.right}>
          <NavLink to="/profile" className={styles.avatar}>
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt={user.firstName} />
            ) : (
              <span>{initials}</span>
            )}
          </NavLink>
          <button onClick={handleLogout} className={styles.logoutBtn} aria-label="Log out">
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
}
