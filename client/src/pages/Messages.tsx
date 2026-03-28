import { useEffect, useState, useRef, type FormEvent, type ChangeEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import Navbar from "../components/Navbar";
import { Send, Image, Mic, Square, MessageSquare, Loader } from "lucide-react";
import styles from "./Messages.module.css";

interface Participant {
  _id: string;
  firstName: string;
  lastName: string;
  profilePicture: string;
}

interface Conversation {
  _id: string;
  participants: Participant[];
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  _id: string;
  sender: Participant;
  text: string;
  image: string;
  audio: string;
  createdAt: string;
  read: boolean;
}

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);
  const [recording, setRecording] = useState(false);
  const [sendingAudio, setSendingAudio] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    api
      .get<{ conversations: Conversation[] }>("/messages/conversations")
      .then(({ conversations }) => {
        setConversations(conversations);
        if (conversations.length > 0) {
          setActiveConv((prev) => prev ?? conversations[0]._id);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingConvs(false));
  }, []);

  useEffect(() => {
    if (!activeConv) return;

    setLoadingMsgs(true);
    const fetchMessages = () => {
      api
        .get<{ messages: Message[] }>(`/messages/${activeConv}`)
        .then(({ messages }) => setMessages(messages))
        .catch(console.error)
        .finally(() => setLoadingMsgs(false));
    };

    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;

    setSending(true);
    try {
      const { message } = await api.post<{ message: Message }>(`/messages/${activeConv}`, {
        text: newMessage.trim(),
      });
      setMessages((prev) => [...prev, message]);
      setNewMessage("");
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConv
            ? { ...c, lastMessage: newMessage.trim(), lastMessageAt: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConv) return;
    setSendingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const { message } = await api.upload<{ message: Message }>(
        `/messages/${activeConv}/image`,
        formData
      );
      setMessages((prev) => [...prev, message]);
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConv
            ? { ...c, lastMessage: "[Image]", lastMessageAt: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      console.error("Image upload error:", err);
    } finally {
      setSendingImage(false);
      e.target.value = "";
    }
  };

  const startRecording = async () => {
    if (!activeConv) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (audioBlob.size === 0) return;

        setSendingAudio(true);
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "voice-message.webm");
          const { message } = await api.upload<{ message: Message }>(
            `/messages/${activeConv}/audio`,
            formData
          );
          setMessages((prev) => [...prev, message]);
          setConversations((prev) =>
            prev.map((c) =>
              c._id === activeConv
                ? { ...c, lastMessage: "[Voice Message]", lastMessageAt: new Date().toISOString() }
                : c
            )
          );
        } catch (err) {
          console.error("Audio upload error:", err);
        } finally {
          setSendingAudio(false);
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Microphone access error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const getOtherParticipant = (conv: Conversation): Participant => {
    return conv.participants.find((p) => p._id !== user?._id) || conv.participants[0];
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const activeConversation = conversations.find((c) => c._id === activeConv);
  const otherUser = activeConversation ? getOtherParticipant(activeConversation) : null;

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="Conversations">
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Messages</h2>
          </div>
          <div className={styles.convList}>
            {loadingConvs ? (
              <div className={styles.sidebarSkeleton}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={styles.convSkeleton}>
                    <div className={styles.convSkeletonAvatar} />
                    <div className={styles.convSkeletonLines}>
                      <div className={styles.skeletonLine} style={{ width: "70%" }} />
                      <div className={styles.skeletonLine} style={{ width: "90%" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className={styles.sidebarEmpty}>
                <p>No conversations yet</p>
                <p className={styles.sidebarHint}>Connect with a partner to start chatting</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const other = getOtherParticipant(conv);
                const initials = `${other.firstName[0]}${other.lastName[0]}`.toUpperCase();
                return (
                  <button
                    key={conv._id}
                    className={`${styles.convItem} ${activeConv === conv._id ? styles.convItemActive : ""}`}
                    onClick={() => setActiveConv(conv._id)}
                  >
                    <div className={styles.convAvatar}>
                      {other.profilePicture ? (
                        <img src={other.profilePicture} alt={other.firstName} />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <div className={styles.convInfo}>
                      <div className={styles.convNameRow}>
                        <span className={styles.convName}>
                          {other.firstName} {other.lastName}
                        </span>
                        <span className={styles.convTime}>{formatTime(conv.lastMessageAt)}</span>
                      </div>
                      <p className={styles.convPreview}>{conv.lastMessage || "No messages yet"}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className={styles.unreadBadge}>{conv.unreadCount}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className={styles.chatArea}>
          {!activeConv ? (
            <div className={styles.chatEmpty}>
              <MessageSquare size={48} />
              <p className={styles.chatEmptyTitle}>Select a conversation</p>
              <p className={styles.chatEmptyText}>
                Choose a conversation from the sidebar to start chatting
              </p>
            </div>
          ) : (
            <>
              <div className={styles.chatHeader}>
                <div className={styles.chatHeaderAvatar}>
                  {otherUser?.profilePicture ? (
                    <img src={otherUser.profilePicture} alt={otherUser.firstName} />
                  ) : (
                    <span>
                      {otherUser
                        ? `${otherUser.firstName[0]}${otherUser.lastName[0]}`.toUpperCase()
                        : ""}
                    </span>
                  )}
                </div>
                <span className={styles.chatHeaderName}>
                  {otherUser?.firstName} {otherUser?.lastName}
                </span>
              </div>

              <div className={styles.messageList} aria-label="Chat messages">
                {loadingMsgs ? (
                  <div className={styles.chatLoading}>
                    <Loader size={24} className={styles.spinning} />
                  </div>
                ) : messages.length === 0 ? (
                  <div className={styles.chatStartMsg}>
                    Start the conversation by sending a message.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender._id === user?._id;
                    return (
                      <div
                        key={msg._id}
                        className={`${styles.message} ${isOwn ? styles.messageOwn : styles.messageOther}`}
                      >
                        <div
                          className={`${styles.messageBubble} ${isOwn ? styles.bubbleOwn : styles.bubbleOther}`}
                        >
                          {msg.image && (
                            <img
                              src={msg.image}
                              alt="Shared image"
                              className={styles.messageImage}
                              onClick={() => window.open(msg.image, "_blank")}
                            />
                          )}
                          {msg.audio && (
                            <audio controls className={styles.messageAudio}>
                              <source src={msg.audio} type="audio/webm" />
                            </audio>
                          )}
                          {msg.text && <p className={styles.messageText}>{msg.text}</p>}
                          <span className={styles.messageTime}>{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className={styles.inputArea}>
                <label className={styles.imageUploadBtn} title="Send image">
                  {sendingImage ? (
                    <Loader size={18} className={styles.spinning} />
                  ) : (
                    <Image size={18} />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className={styles.fileInput}
                    disabled={sendingImage}
                  />
                </label>
                <button
                  type="button"
                  className={`${styles.recordBtn} ${recording ? styles.recordBtnActive : ""}`}
                  onClick={recording ? stopRecording : startRecording}
                  disabled={sendingAudio}
                  aria-label={recording ? "Stop recording" : "Record voice message"}
                >
                  {sendingAudio ? (
                    <Loader size={18} className={styles.spinning} />
                  ) : recording ? (
                    <Square size={18} />
                  ) : (
                    <Mic size={18} />
                  )}
                </button>
                <input
                  className={styles.messageInput}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  maxLength={2000}
                />
                <button
                  type="submit"
                  className={styles.sendBtn}
                  disabled={!newMessage.trim() || sending}
                  aria-label="Send message"
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
}