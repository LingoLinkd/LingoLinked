import { Router, Response } from "express";
import User from "../models/User";
import Match from "../models/Match";
import Conversation from "../models/Conversation";
import Message from "../models/Message";
import { authenticate, AuthRequest } from "../middleware/auth";
import { computeMatchScore } from "../utils/matchScoring";

const router = Router();

// GET /api/matches/suggestions - get match suggestions for current user
router.get("/suggestions", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Find existing matches to exclude
    const existingMatches = await Match.find({
      users: req.userId,
      status: { $in: ["pending", "accepted"] },
    });
    const excludeIds = existingMatches.flatMap((m) => m.users.map((id) => id.toString()));
    excludeIds.push(req.userId!);

    // Find potential matches
    const candidates = await User.find({
      _id: { $nin: excludeIds },
      accountStatus: "active",
    }).limit(100);

    // Score and sort
    const scored = candidates
      .map((candidate) => {
        const { score, sharedLanguages } = computeMatchScore(currentUser, candidate);
        return { user: candidate, score, sharedLanguages };
      })
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    res.json({ suggestions: scored });
  } catch (err) {
    console.error("Get suggestions error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/matches/:userId/connect - send a match request
router.post(
  "/:userId/connect",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const targetUserId = req.params.userId;

      if (targetUserId === req.userId) {
        res.status(400).json({ error: "Cannot match with yourself" });
        return;
      }

      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Check for existing match
      const existing = await Match.findOne({
        users: { $all: [req.userId, targetUserId] },
        status: { $in: ["pending", "accepted"] },
      });

      if (existing) {
        res.status(409).json({ error: "Match already exists" });
        return;
      }

      const currentUser = await User.findById(req.userId);
      if (!currentUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const { score, sharedLanguages } = computeMatchScore(currentUser, targetUser);

      const match = await Match.create({
        users: [req.userId, targetUserId],
        score,
        sharedLanguages,
        initiator: req.userId,
      });

      res.status(201).json({ match });
    } catch (err) {
      console.error("Connect error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// PUT /api/matches/:matchId/accept - accept a match request
router.put(
  "/:matchId/accept",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const match = await Match.findById(req.params.matchId);
      if (!match) {
        res.status(404).json({ error: "Match not found" });
        return;
      }

      const isParticipant = match.users.some((id) => id.toString() === req.userId);
      if (!isParticipant) {
        res.status(403).json({ error: "Not authorized" });
        return;
      }

      if (match.initiator.toString() === req.userId) {
        res.status(400).json({ error: "Cannot accept your own request" });
        return;
      }

      match.status = "accepted";
      await match.save();

      // Create a conversation between matched users
      let conversation = await Conversation.findOne({
        participants: { $all: match.users },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: match.users,
        });

        // Send automated welcome message
        const initiator = await User.findById(match.initiator);
        const languageList = match.sharedLanguages.join(", ");
        await Message.create({
          conversation: conversation._id,
          sender: match.initiator,
          text: `Hi! I'm ${initiator?.firstName} and I'd love to practice ${languageList} together!`,
        });

        conversation.lastMessage = `Hi! I'm ${initiator?.firstName} and I'd love to practice ${languageList} together!`;
        conversation.lastMessageAt = new Date();
        await conversation.save();
      }

      res.json({ match, conversation });
    } catch (err) {
      console.error("Accept match error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// PUT /api/matches/:matchId/decline - decline a match request
router.put(
  "/:matchId/decline",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const match = await Match.findById(req.params.matchId);
      if (!match) {
        res.status(404).json({ error: "Match not found" });
        return;
      }

      const isParticipant = match.users.some((id) => id.toString() === req.userId);
      if (!isParticipant) {
        res.status(403).json({ error: "Not authorized" });
        return;
      }

      match.status = "declined";
      await match.save();

      res.json({ match });
    } catch (err) {
      console.error("Decline match error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// GET /api/matches - get all matches for current user
router.get("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: Record<string, unknown> = { users: req.userId };
    if (status) {
      filter.status = status;
    }

    const matches = await Match.find(filter)
      .populate("users", "firstName lastName profilePicture knownLanguages learningLanguages bio")
      .sort({ createdAt: -1 });

    res.json({ matches });
  } catch (err) {
    console.error("Get matches error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
