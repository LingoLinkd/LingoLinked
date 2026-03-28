jest.mock("../../models/User");
jest.mock("../../models/Match");
jest.mock("../../models/Conversation");
jest.mock("../../models/Message");
jest.mock("../../utils/matchScoring");
jest.mock("jsonwebtoken");
jest.mock("../../middleware/upload", () => ({
  uploadProfilePic: {
    single: () => (_req: any, _res: any, next: any) => next(),
  },
  uploadMessageImage: {
    single: () => (_req: any, _res: any, next: any) => next(),
  },
  uploadMessageAudio: {
    single: () => (_req: any, _res: any, next: any) => next(),
  },
}));

import request from "supertest";
import app from "../../app";
import User from "../../models/User";
import Match from "../../models/Match";
import Conversation from "../../models/Conversation";
import Message from "../../models/Message";
import { computeMatchScore } from "../../utils/matchScoring";
import jwt from "jsonwebtoken";

const AUTH_HEADER = { Authorization: "Bearer test-token" };

const mockCurrentUser = {
  _id: "test-user-id",
  firstName: "Test",
  lastName: "User",
  knownLanguages: [{ language: "English", proficiency: "native" }],
  learningLanguages: [{ language: "Spanish", proficiency: "beginner" }],
  interests: ["music"],
  accountStatus: "active",
};

const mockTargetUser = {
  _id: "target-user-id",
  firstName: "Target",
  lastName: "User",
  knownLanguages: [{ language: "Spanish", proficiency: "native" }],
  learningLanguages: [{ language: "English", proficiency: "beginner" }],
  interests: ["music"],
  accountStatus: "active",
};

beforeEach(() => {
  jest.clearAllMocks();
  (jwt.verify as jest.Mock).mockReturnValue({ userId: "test-user-id" });
});

// ─── GET /api/matches/suggestions ────────────────────────────────────────────

describe("GET /api/matches/suggestions", () => {
  it("returns scored suggestions sorted by score descending", async () => {
    (User.findById as jest.Mock).mockResolvedValue(mockCurrentUser);
    (Match.find as jest.Mock).mockResolvedValue([]);

    const limitMock = jest.fn().mockResolvedValue([mockTargetUser]);
    (User.find as jest.Mock).mockReturnValue({ limit: limitMock });

    (computeMatchScore as jest.Mock).mockReturnValue({
      score: 85,
      sharedLanguages: ["Spanish"],
    });

    const res = await request(app).get("/api/matches/suggestions").set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("suggestions");
    expect(res.body.suggestions).toHaveLength(1);
    expect(res.body.suggestions[0].score).toBe(85);
  });

  it("filters out candidates with score 0", async () => {
    (User.findById as jest.Mock).mockResolvedValue(mockCurrentUser);
    (Match.find as jest.Mock).mockResolvedValue([]);

    const limitMock = jest.fn().mockResolvedValue([mockTargetUser]);
    (User.find as jest.Mock).mockReturnValue({ limit: limitMock });

    (computeMatchScore as jest.Mock).mockReturnValue({
      score: 0,
      sharedLanguages: [],
    });

    const res = await request(app).get("/api/matches/suggestions").set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body.suggestions).toHaveLength(0);
  });

  it("returns 404 when current user is not found", async () => {
    (User.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get("/api/matches/suggestions").set(AUTH_HEADER);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "User not found");
  });
});

// ─── POST /api/matches/:userId/connect ───────────────────────────────────────

describe("POST /api/matches/:userId/connect", () => {
  it("creates a match request successfully", async () => {
    (User.findById as jest.Mock)
      .mockResolvedValueOnce(mockTargetUser) // targetUser lookup
      .mockResolvedValueOnce(mockCurrentUser); // currentUser lookup
    (Match.findOne as jest.Mock).mockResolvedValue(null);
    (computeMatchScore as jest.Mock).mockReturnValue({
      score: 85,
      sharedLanguages: ["Spanish"],
    });
    (Match.create as jest.Mock).mockResolvedValue({
      _id: "match-1",
      users: ["test-user-id", "target-user-id"],
      score: 85,
      sharedLanguages: ["Spanish"],
      initiator: "test-user-id",
      status: "pending",
    });

    const res = await request(app).post("/api/matches/target-user-id/connect").set(AUTH_HEADER);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("match");
    expect(res.body.match.status).toBe("pending");
  });

  it("returns 400 when trying to match with yourself", async () => {
    const res = await request(app).post("/api/matches/test-user-id/connect").set(AUTH_HEADER);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Cannot match with yourself");
  });

  it("returns 404 when target user does not exist", async () => {
    (User.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).post("/api/matches/nonexistent/connect").set(AUTH_HEADER);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "User not found");
  });

  it("returns 409 when match already exists", async () => {
    (User.findById as jest.Mock).mockResolvedValue(mockTargetUser);
    (Match.findOne as jest.Mock).mockResolvedValue({ _id: "existing-match" });

    const res = await request(app).post("/api/matches/target-user-id/connect").set(AUTH_HEADER);

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("error", "Match already exists");
  });
});

// ─── PUT /api/matches/:matchId/accept ────────────────────────────────────────

describe("PUT /api/matches/:matchId/accept", () => {
  it("accepts a match and creates a conversation with welcome message", async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    const mockMatch = {
      _id: "match-1",
      users: [{ toString: () => "other-user-id" }, { toString: () => "test-user-id" }],
      initiator: { toString: () => "other-user-id" },
      status: "pending",
      sharedLanguages: ["Spanish"],
      save: saveMock,
    };

    (Match.findById as jest.Mock).mockResolvedValue(mockMatch);
    (Conversation.findOne as jest.Mock).mockResolvedValue(null);

    const convSaveMock = jest.fn().mockResolvedValue(undefined);
    const newConv = {
      _id: "conv-new",
      participants: mockMatch.users,
      lastMessage: "",
      lastMessageAt: null as any,
      save: convSaveMock,
    };
    (Conversation.create as jest.Mock).mockResolvedValue(newConv);
    (User.findById as jest.Mock).mockResolvedValue({
      _id: "other-user-id",
      firstName: "Other",
    });
    (Message.create as jest.Mock).mockResolvedValue({});

    const res = await request(app).put("/api/matches/match-1/accept").set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("match");
    expect(res.body).toHaveProperty("conversation");
    expect(mockMatch.status).toBe("accepted");
    expect(saveMock).toHaveBeenCalled();
    expect(Message.create).toHaveBeenCalled();
  });

  it("returns 400 when initiator tries to accept their own request", async () => {
    const mockMatch = {
      _id: "match-1",
      users: [{ toString: () => "test-user-id" }, { toString: () => "other-user-id" }],
      initiator: { toString: () => "test-user-id" },
      status: "pending",
      save: jest.fn(),
    };

    (Match.findById as jest.Mock).mockResolvedValue(mockMatch);

    const res = await request(app).put("/api/matches/match-1/accept").set(AUTH_HEADER);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Cannot accept your own request");
  });

  it("returns 404 when match is not found", async () => {
    (Match.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).put("/api/matches/nonexistent/accept").set(AUTH_HEADER);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Match not found");
  });
});

// ─── PUT /api/matches/:matchId/decline ───────────────────────────────────────

describe("PUT /api/matches/:matchId/decline", () => {
  it("declines a match successfully", async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    const mockMatch = {
      _id: "match-1",
      users: [{ toString: () => "test-user-id" }, { toString: () => "other-user-id" }],
      status: "pending",
      save: saveMock,
    };

    (Match.findById as jest.Mock).mockResolvedValue(mockMatch);

    const res = await request(app).put("/api/matches/match-1/decline").set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("match");
    expect(mockMatch.status).toBe("declined");
    expect(saveMock).toHaveBeenCalled();
  });

  it("returns 403 when user is not a participant", async () => {
    const mockMatch = {
      _id: "match-1",
      users: [{ toString: () => "user-a" }, { toString: () => "user-b" }],
      status: "pending",
      save: jest.fn(),
    };

    (Match.findById as jest.Mock).mockResolvedValue(mockMatch);

    const res = await request(app).put("/api/matches/match-1/decline").set(AUTH_HEADER);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error", "Not authorized");
  });
});

// ─── GET /api/matches ────────────────────────────────────────────────────────

describe("GET /api/matches", () => {
  it("returns all matches for the current user", async () => {
    const sortMock = jest
      .fn()
      .mockResolvedValue([{ _id: "match-1", users: [], status: "pending" }]);
    const populateMock = jest.fn().mockReturnValue({ sort: sortMock });
    (Match.find as jest.Mock).mockReturnValue({ populate: populateMock });

    const res = await request(app).get("/api/matches").set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("matches");
    expect(Array.isArray(res.body.matches)).toBe(true);
  });
});
