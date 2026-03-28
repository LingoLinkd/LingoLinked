import { Router, Response } from "express";
import mongoose from "mongoose";
import Event from "../models/Event";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/events - list upcoming events
router.get("/", authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const events = await Event.find({ date: { $gte: new Date() } })
      .populate("organizer", "firstName lastName profilePicture")
      .populate("attendees", "firstName lastName profilePicture")
      .sort({ date: 1 });
    res.json({ events });
  } catch (err) {
    console.error("Get events error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/events/:id - get single event
router.get("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizer", "firstName lastName profilePicture")
      .populate("attendees", "firstName lastName profilePicture");
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    res.json({ event });
  } catch (err) {
    console.error("Get event error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/events - create event
router.post("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, date, time, location, language, maxAttendees } = req.body;

    if (!title || !description || !date || !time || !location) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const event = await Event.create({
      title,
      description,
      date,
      time,
      location,
      language: language || "",
      maxAttendees: maxAttendees || 0,
      organizer: req.userId,
      attendees: [req.userId], // organizer is auto-registered
    });

    const populated = await event.populate("organizer", "firstName lastName profilePicture");

    res.status(201).json({ event: populated });
  } catch (err) {
    console.error("Create event error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/events/:id/register - register for event
router.post(
  "/:id/register",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        res.status(404).json({ error: "Event not found" });
        return;
      }

      if (event.attendees.some((id) => id.toString() === req.userId)) {
        res.status(409).json({ error: "Already registered" });
        return;
      }

      if (event.maxAttendees > 0 && event.attendees.length >= event.maxAttendees) {
        res.status(400).json({ error: "Event is full" });
        return;
      }

      event.attendees.push(new mongoose.Types.ObjectId(req.userId));
      await event.save();

      const populated = await Event.findById(event._id)
        .populate("organizer", "firstName lastName profilePicture")
        .populate("attendees", "firstName lastName profilePicture");

      res.json({ event: populated });
    } catch (err) {
      console.error("Register for event error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// DELETE /api/events/:id/register - unregister from event
router.delete(
  "/:id/register",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        res.status(404).json({ error: "Event not found" });
        return;
      }

      if (event.organizer.toString() === req.userId) {
        res.status(400).json({ error: "Organizer cannot unregister" });
        return;
      }

      event.attendees = event.attendees.filter(
        (id) => id.toString() !== req.userId
      ) as typeof event.attendees;
      await event.save();

      const populated = await Event.findById(event._id)
        .populate("organizer", "firstName lastName profilePicture")
        .populate("attendees", "firstName lastName profilePicture");

      res.json({ event: populated });
    } catch (err) {
      console.error("Unregister from event error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
