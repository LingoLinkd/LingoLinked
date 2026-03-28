import express from "express";
import cors from "cors";
import path from "path";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import matchRoutes from "./routes/matches";
import messageRoutes from "./routes/messages";
import eventRoutes from "./routes/events";

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/events", eventRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

export default app;