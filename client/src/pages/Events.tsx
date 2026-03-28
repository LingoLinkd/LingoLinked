import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import { LANGUAGES } from "../utils/languages";
import Navbar from "../components/Navbar";
import { Plus, Calendar, Clock, MapPin, Users, X, CalendarPlus } from "lucide-react";
import styles from "./Events.module.css";

//Organizer info for an event
interface EventOrganizer {
  _id: string;
  firstName: string;
  lastName: string;
  profilePicture: string;
}

//Event data structure
interface EventData {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: EventOrganizer;
  attendees: EventOrganizer[];
  language: string;
  maxAttendees: number;
}

export default function Events() {
  const { user } = useAuth();
  //Store events and loading state
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  //Create form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [language, setLanguage] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  //Fetch all upcoming events from the api
  const fetchEvents = () => {
    api
      .get<{ events: EventData[] }>("/events")
      .then(({ events }) => setEvents(events))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  //Handle create event form submission
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    //Validate required fields before submitting
    if (!title || !description || !date || !time || !location) {
      setError("Please fill in all required fields");
      return;
    }
    setCreating(true);
    setError("");
    try {
      await api.post("/events", {
        title,
        description,
        date,
        time,
        location,
        language,
        //Default to 0 (unlimited) if no max set
        maxAttendees: maxAttendees ? Number(maxAttendees) : 0,
      });
      //Reset form and close modal on success
      setShowCreate(false);
      setTitle("");
      setDescription("");
      setDate("");
      setTime("");
      setLocation("");
      setLanguage("");
      setMaxAttendees("");
      fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setCreating(false);
    }
  };

  //Register current user for an event
  const handleRegister = async (eventId: string) => {
    setActionLoading(eventId);
    try {
      await api.post(`/events/${eventId}/register`, {});
      fetchEvents();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  //Unregister current user from an event
  const handleUnregister = async (eventId: string) => {
    setActionLoading(eventId);
    try {
      await api.delete(`/events/${eventId}/register`);
      fetchEvents();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  //Check if current user is already registered
  const isRegistered = (event: EventData) => event.attendees.some((a) => a._id === user?._id);
  //Check if current user is the organizer
  const isOrganizer = (event: EventData) => event.organizer._id === user?._id;

  //Format date string for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Events</h1>
              <p className={styles.subtitle}>Discover and join language exchange events</p>
            </div>
            <button className={styles.createBtn} onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Create Event
            </button>
          </div>

          {loading ? (
            //Show skeleton cards while loading
            <div className={styles.grid}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.skeleton}>
                  <div className={styles.skeletonHeader}>
                    <div className={styles.skeletonLine} style={{ width: "60%" }} />
                    <div
                      className={styles.skeletonLine}
                      style={{ width: "60px", height: "22px" }}
                    />
                  </div>
                  <div className={styles.skeletonLine} style={{ width: "100%" }} />
                  <div className={styles.skeletonLine} style={{ width: "85%" }} />
                  <div className={styles.skeletonDetails}>
                    <div className={styles.skeletonLine} style={{ width: "70%" }} />
                    <div className={styles.skeletonLine} style={{ width: "50%" }} />
                    <div className={styles.skeletonLine} style={{ width: "60%" }} />
                    <div className={styles.skeletonLine} style={{ width: "40%" }} />
                  </div>
                  <div className={styles.skeletonLine} style={{ width: "100%", height: "40px" }} />
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            //Empty state when no events exist
            <div className={styles.empty}>
              <CalendarPlus size={48} />
              <p className={styles.emptyTitle}>No upcoming events</p>
              <p className={styles.emptyText}>Be the first to create a language exchange event!</p>
            </div>
          ) : (
            //Render event cards
            <div className={styles.grid}>
              {events.map((event) => (
                <div key={event._id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{event.title}</h3>
                    {event.language && <span className={styles.langTag}>{event.language}</span>}
                  </div>
                  <p className={styles.cardDesc}>{event.description}</p>
                  <div className={styles.details}>
                    <div className={styles.detail}>
                      <span className={styles.detailIcon}>
                        <Calendar size={16} />
                      </span>
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className={styles.detail}>
                      <span className={styles.detailIcon}>
                        <Clock size={16} />
                      </span>
                      <span>{event.time}</span>
                    </div>
                    <div className={styles.detail}>
                      <span className={styles.detailIcon}>
                        <MapPin size={16} />
                      </span>
                      <span>{event.location}</span>
                    </div>
                    <div className={styles.detail}>
                      <span className={styles.detailIcon}>
                        <Users size={16} />
                      </span>
                      <span>
                        {event.attendees.length}
                        {event.maxAttendees > 0 ? ` / ${event.maxAttendees}` : ""} attending
                      </span>
                    </div>
                  </div>
                  <div className={styles.organizer}>
                    <span className={styles.organizerLabel}>Organized by</span>
                    <span className={styles.organizerName}>
                      {event.organizer.firstName} {event.organizer.lastName}
                    </span>
                  </div>
                  {event.attendees.length > 0 && (
                    //Show up to 5 attendee avatars then a +N overflow count
                    <div className={styles.attendeeRow}>
                      {event.attendees.slice(0, 5).map((a) => (
                        <div
                          key={a._id}
                          className={styles.attendeeAvatar}
                          title={`${a.firstName} ${a.lastName}`}
                        >
                          {a.profilePicture ? (
                            <img src={a.profilePicture} alt={a.firstName} />
                          ) : (
                            <span>
                              {a.firstName[0]}
                              {a.lastName[0]}
                            </span>
                          )}
                        </div>
                      ))}
                      {event.attendees.length > 5 && (
                        <span className={styles.moreAttendees}>+{event.attendees.length - 5}</span>
                      )}
                    </div>
                  )}
                  <div className={styles.cardActions}>
                    {isOrganizer(event) ? (
                      <span className={styles.organizerBadge}>You are the organizer</span>
                    ) : isRegistered(event) ? (
                      <button
                        className={styles.unregisterBtn}
                        onClick={() => handleUnregister(event._id)}
                        disabled={actionLoading === event._id}
                      >
                        {actionLoading === event._id ? "Processing..." : "Unregister"}
                      </button>
                    ) : (
                      <button
                        className={styles.registerBtn}
                        onClick={() => handleRegister(event._id)}
                        //Disable if full
                        disabled={
                          actionLoading === event._id ||
                          (event.maxAttendees > 0 && event.attendees.length >= event.maxAttendees)
                        }
                      >
                        {actionLoading === event._id
                          ? "Processing..."
                          : event.maxAttendees > 0 && event.attendees.length >= event.maxAttendees
                            ? "Event Full"
                            : "Register"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/*Create event modal, closes when clicking outside*/}
      {showCreate && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          onClick={() => setShowCreate(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Create Event</h2>
              <button className={styles.closeBtn} onClick={() => setShowCreate(false)}>
                <X size={20} />
              </button>
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <form onSubmit={handleCreate} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Title *</label>
                <input
                  className={styles.input}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Spanish Conversation Circle"
                  maxLength={200}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Description *</label>
                <textarea
                  className={styles.textarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your event..."
                  maxLength={2000}
                  rows={3}
                />
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Date *</label>
                  <input
                    className={styles.input}
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Time *</label>
                  <input
                    className={styles.input}
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Location *</label>
                <input
                  className={styles.input}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. DCC 308, RPI Campus"
                />
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Language (optional)</label>
                  <select
                    className={styles.select}
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="">Any language</option>
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Max Attendees</label>
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    value={maxAttendees}
                    onChange={(e) => setMaxAttendees(e.target.value)}
                    placeholder="0 = unlimited"
                  />
                </div>
              </div>
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={creating}>
                  {creating ? "Creating..." : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}