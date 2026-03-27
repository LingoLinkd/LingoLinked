import { Router, Response } from "express";
import User from "../models/User";
import { authenticate, AuthRequest } from "../middleware/auth";
import { uploadProfilePic } from "../middleware/upload";

const router = Router();

// GET /api/users/profile - get own profile
router.get("/profile", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/users/profile - update own profile
router.put("/profile", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const allowedFields = [
      "firstName",
      "lastName",
      "bio",
      "profilePicture",
      "knownLanguages",
      "learningLanguages",
      "interests",
      "university",
      "major",
      "yearOfStudy",
      "accountStatus",
      "role",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/users/profile/picture - upload profile picture
router.post(
  "/profile/picture",
  authenticate,
  uploadProfilePic.single("profilePicture"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No image file provided" });
        return;
      }

      const pictureUrl = `/uploads/profiles/${req.file.filename}`;
      const user = await User.findByIdAndUpdate(
        req.userId,
        { profilePicture: pictureUrl },
        { new: true }
      );

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({ user });
    } catch (err) {
      console.error("Upload profile picture error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// GET /api/users/:id - get another user's public profile
router.get("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select("-email -updatedAt");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/users - search users with filters
router.get("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { language, proficiency, role, search } = req.query;

    const filter: Record<string, unknown> = {
      _id: { $ne: req.userId },
      accountStatus: "active",
    };

    if (language) {
      filter.$or = [
        { "knownLanguages.language": language },
        { "learningLanguages.language": language },
      ];
    }

    if (proficiency) {
      filter.$or = [
        { "knownLanguages.proficiency": proficiency },
        { "learningLanguages.proficiency": proficiency },
      ];
    }

    if (role) {
      filter.role = role;
    }

    if (search) {
      const regex = new RegExp(search as string, "i");
      filter.$or = [{ firstName: regex }, { lastName: regex }];
    }

    const users = await User.find(filter)
      .select("-email -updatedAt")
      .limit(50)
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (err) {
    console.error("Search users error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;