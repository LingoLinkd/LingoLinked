import { Router, Response } from "express";
import Conversation from "../models/Conversation";
import Message from "../models/Message";
import { authenticate, AuthRequest } from "../middleware/auth";
import { uploadMessageImage, uploadMessageAudio, uploadMessageVideo } from "../middleware/upload";

const router = Router();

// GET /api/messages/conversations - list all conversations for current user
router.get(
  "/conversations",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const conversations = await Conversation.find({
        participants: req.userId,
      })
        .populate("participants", "firstName lastName profilePicture")
        .sort({ lastMessageAt: -1 });

      // Get unread counts for each conversation
      const withUnread = await Promise.all(
        conversations.map(async (conv) => {
          const unreadCount = await Message.countDocuments({
            conversation: conv._id,
            sender: { $ne: req.userId },
            read: false,
          });
          return { ...conv.toJSON(), unreadCount };
        })
      );

      res.json({ conversations: withUnread });
    } catch (err) {
      console.error("Get conversations error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// GET /api/messages/:conversationId - get messages in a conversation
router.get(
  "/:conversationId",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const conversation = await Conversation.findById(req.params.conversationId);
      if (!conversation) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }

      const isParticipant = conversation.participants.some((id) => id.toString() === req.userId);
      if (!isParticipant) {
        res.status(403).json({ error: "Not authorized" });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = 50;
      const skip = (page - 1) * limit;

      const messages = await Message.find({
        conversation: req.params.conversationId,
      })
        .populate("sender", "firstName lastName profilePicture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Mark messages as read
      await Message.updateMany(
        {
          conversation: req.params.conversationId,
          sender: { $ne: req.userId },
          read: false,
        },
        { read: true }
      );

      res.json({ messages: messages.reverse() });
    } catch (err) {
      console.error("Get messages error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// POST /api/messages/:conversationId/image - send an image message
router.post(
  "/:conversationId/image",
  authenticate,
  uploadMessageImage.single("image"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const conversation = await Conversation.findById(req.params.conversationId);
      if (!conversation) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }

      const isParticipant = conversation.participants.some((id) => id.toString() === req.userId);
      if (!isParticipant) {
        res.status(403).json({ error: "Not authorized" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "No image file provided" });
        return;
      }

      const imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const message = await Message.create({
        conversation: conversation._id,
        sender: req.userId,
        text: req.body.text || "",
        image: imageUrl,
      });

      conversation.lastMessage = "[Image]";
      conversation.lastMessageAt = new Date();
      await conversation.save();

      const populated = await message.populate("sender", "firstName lastName profilePicture");

      res.status(201).json({ message: populated });
    } catch (err) {
      console.error("Send image message error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// POST /api/messages/:conversationId/audio - send a voice message
router.post(
  "/:conversationId/audio",
  authenticate,
  uploadMessageAudio.single("audio"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const conversation = await Conversation.findById(req.params.conversationId);
      if (!conversation) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }

      const isParticipant = conversation.participants.some((id) => id.toString() === req.userId);
      if (!isParticipant) {
        res.status(403).json({ error: "Not authorized" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "No audio file provided" });
        return;
      }

      const audioUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const message = await Message.create({
        conversation: conversation._id,
        sender: req.userId,
        audio: audioUrl,
      });

      conversation.lastMessage = "[Voice Message]";
      conversation.lastMessageAt = new Date();
      await conversation.save();

      const populated = await message.populate("sender", "firstName lastName profilePicture");

      res.status(201).json({ message: populated });
    } catch (err) {
      console.error("Send audio message error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// POST /api/messages/:conversationId/video - send a video message
router.post(
  "/:conversationId/video",
  authenticate,
  uploadMessageVideo.single("video"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const conversation = await Conversation.findById(req.params.conversationId);
      if (!conversation) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }

      const isParticipant = conversation.participants.some((id) => id.toString() === req.userId);
      if (!isParticipant) {
        res.status(403).json({ error: "Not authorized" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "No video file provided" });
        return;
      }

      const videoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const message = await Message.create({
        conversation: conversation._id,
        sender: req.userId,
        video: videoUrl,
      });

      conversation.lastMessage = "[Video]";
      conversation.lastMessageAt = new Date();
      await conversation.save();

      const populated = await message.populate("sender", "firstName lastName profilePicture");

      res.status(201).json({ message: populated });
    } catch (err) {
      console.error("Send video message error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// POST /api/messages/:conversationId - send a message
router.post(
  "/:conversationId",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const conversation = await Conversation.findById(req.params.conversationId);
      if (!conversation) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }

      const isParticipant = conversation.participants.some((id) => id.toString() === req.userId);
      if (!isParticipant) {
        res.status(403).json({ error: "Not authorized" });
        return;
      }

      const { text } = req.body;
      if (!text?.trim()) {
        res.status(400).json({ error: "Message text is required" });
        return;
      }

      const message = await Message.create({
        conversation: conversation._id,
        sender: req.userId,
        text: text.trim(),
      });

      conversation.lastMessage = text.trim();
      conversation.lastMessageAt = new Date();
      await conversation.save();

      const populated = await message.populate("sender", "firstName lastName profilePicture");

      res.status(201).json({ message: populated });
    } catch (err) {
      console.error("Send message error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;