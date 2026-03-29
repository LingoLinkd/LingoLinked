jest.mock("../../models/Conversation");
jest.mock("../../models/Message");
jest.mock("jsonwebtoken");
jest.mock("../../middleware/upload", () => ({
  uploadProfilePic: {
    single: () => (_req: any, _res: any, next: any) => next(),
  },
  uploadMessageImage: {
    single: () => (_req: any, _res: any, next: any) => {
      // By default, simulate no file attached
      next();
    },
  },
  uploadMessageAudio: {
    single: () => (_req: any, _res: any, next: any) => {
      next();
    },
  },
}));

import request from "supertest";
import app from "../../app";
import Conversation from "../../models/Conversation";
import Message from "../../models/Message";
import jwt from "jsonwebtoken";

const AUTH_HEADER = { Authorization: "Bearer test-token" };
const CONV_ID = "conv-123";

const mockConversation = {
  _id: CONV_ID,
  participants: [{ toString: () => "test-user-id" }, { toString: () => "other-user-id" }],
  lastMessage: "",
  lastMessageAt: new Date(),
  save: jest.fn().mockResolvedValue(undefined),
  toJSON() {
    return {
      _id: this._id,
      participants: this.participants,
      lastMessage: this.lastMessage,
      lastMessageAt: this.lastMessageAt,
    };
  },
};

const mockMessage = {
  _id: "msg-1",
  conversation: CONV_ID,
  sender: "test-user-id",
  text: "Hello!",
  image: "",
  audio: "",
  read: false,
  createdAt: new Date(),
  populate: jest.fn().mockImplementation(function (this: any) {
    return Promise.resolve(this);
  }),
};

beforeEach(() => {
  jest.clearAllMocks();
  (jwt.verify as jest.Mock).mockReturnValue({ userId: "test-user-id" });
});

// ─── GET /api/messages/conversations ─────────────────────────────────────────

describe("GET /api/messages/conversations", () => {
  it("returns list of conversations with unread counts", async () => {
    const sortMock = jest.fn().mockResolvedValue([mockConversation]);
    const populateMock = jest.fn().mockReturnValue({ sort: sortMock });
    (Conversation.find as jest.Mock).mockReturnValue({
      populate: populateMock,
    });
    (Message.countDocuments as jest.Mock).mockResolvedValue(3);

    const res = await request(app).get("/api/messages/conversations").set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("conversations");
    expect(Array.isArray(res.body.conversations)).toBe(true);
    expect(res.body.conversations[0]).toHaveProperty("unreadCount", 3);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/messages/conversations");

    expect(res.status).toBe(401);
  });
});

// ─── GET /api/messages/:conversationId ───────────────────────────────────────

describe("GET /api/messages/:conversationId", () => {
  it("returns messages when user is a participant", async () => {
    (Conversation.findById as jest.Mock).mockResolvedValue(mockConversation);

    const limitMock = jest.fn().mockResolvedValue([mockMessage]);
    const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
    const sortMock = jest.fn().mockReturnValue({ skip: skipMock });
    const populateMock = jest.fn().mockReturnValue({ sort: sortMock });
    (Message.find as jest.Mock).mockReturnValue({ populate: populateMock });
    (Message.updateMany as jest.Mock).mockResolvedValue({});

    const res = await request(app).get(`/api/messages/${CONV_ID}`).set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("messages");
    expect(Array.isArray(res.body.messages)).toBe(true);
  });

  it("returns 404 when conversation does not exist", async () => {
    (Conversation.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get("/api/messages/nonexistent").set(AUTH_HEADER);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Conversation not found");
  });

  it("returns 403 when user is not a participant", async () => {
    const foreignConversation = {
      _id: "conv-other",
      participants: [{ toString: () => "user-a" }, { toString: () => "user-b" }],
    };
    (Conversation.findById as jest.Mock).mockResolvedValue(foreignConversation);

    const res = await request(app).get("/api/messages/conv-other").set(AUTH_HEADER);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error", "Not authorized");
  });

  it("marks unread messages as read", async () => {
    (Conversation.findById as jest.Mock).mockResolvedValue(mockConversation);

    const limitMock = jest.fn().mockResolvedValue([]);
    const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
    const sortMock = jest.fn().mockReturnValue({ skip: skipMock });
    const populateMock = jest.fn().mockReturnValue({ sort: sortMock });
    (Message.find as jest.Mock).mockReturnValue({ populate: populateMock });
    (Message.updateMany as jest.Mock).mockResolvedValue({});

    await request(app).get(`/api/messages/${CONV_ID}`).set(AUTH_HEADER);

    expect(Message.updateMany).toHaveBeenCalledWith(
      {
        conversation: CONV_ID,
        sender: { $ne: "test-user-id" },
        read: false,
      },
      { read: true }
    );
  });
});

// ─── POST /api/messages/:conversationId ──────────────────────────────────────

describe("POST /api/messages/:conversationId", () => {
  it("sends a text message successfully", async () => {
    (Conversation.findById as jest.Mock).mockResolvedValue({
      ...mockConversation,
      save: jest.fn().mockResolvedValue(undefined),
    });
    (Message.create as jest.Mock).mockResolvedValue(mockMessage);

    const res = await request(app)
      .post(`/api/messages/${CONV_ID}`)
      .set(AUTH_HEADER)
      .send({ text: "Hello!" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message");
  });

  it("returns 400 when text is empty or whitespace", async () => {
    (Conversation.findById as jest.Mock).mockResolvedValue(mockConversation);

    const res = await request(app)
      .post(`/api/messages/${CONV_ID}`)
      .set(AUTH_HEADER)
      .send({ text: "   " });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Message text is required");
  });

  it("returns 404 when conversation does not exist", async () => {
    (Conversation.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post("/api/messages/nonexistent")
      .set(AUTH_HEADER)
      .send({ text: "Hello!" });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Conversation not found");
  });

  it("returns 403 when user is not a participant", async () => {
    const foreignConversation = {
      _id: "conv-other",
      participants: [{ toString: () => "user-a" }, { toString: () => "user-b" }],
    };
    (Conversation.findById as jest.Mock).mockResolvedValue(foreignConversation);

    const res = await request(app)
      .post("/api/messages/conv-other")
      .set(AUTH_HEADER)
      .send({ text: "Hello!" });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error", "Not authorized");
  });

  it("updates conversation lastMessage and lastMessageAt on send", async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    const conv = {
      ...mockConversation,
      lastMessage: "",
      lastMessageAt: null as any,
      save: saveMock,
    };
    (Conversation.findById as jest.Mock).mockResolvedValue(conv);
    (Message.create as jest.Mock).mockResolvedValue(mockMessage);

    await request(app)
      .post(`/api/messages/${CONV_ID}`)
      .set(AUTH_HEADER)
      .send({ text: "New message" });

    expect(conv.lastMessage).toBe("New message");
    expect(conv.lastMessageAt).toBeInstanceOf(Date);
    expect(saveMock).toHaveBeenCalled();
  });
});

// ─── POST /api/messages/:conversationId/image ────────────────────────────────

describe("POST /api/messages/:conversationId/image", () => {
  it("returns 400 when no image file is provided", async () => {
    (Conversation.findById as jest.Mock).mockResolvedValue(mockConversation);

    const res = await request(app).post(`/api/messages/${CONV_ID}/image`).set(AUTH_HEADER);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "No image file provided");
  });

  it("returns 404 when conversation does not exist for image upload", async () => {
    (Conversation.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).post("/api/messages/nonexistent/image").set(AUTH_HEADER);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Conversation not found");
  });
});

// ─── POST /api/messages/:conversationId/audio ────────────────────────────────

describe("POST /api/messages/:conversationId/audio", () => {
  it("returns 400 when no audio file is provided", async () => {
    (Conversation.findById as jest.Mock).mockResolvedValue(mockConversation);

    const res = await request(app).post(`/api/messages/${CONV_ID}/audio`).set(AUTH_HEADER);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "No audio file provided");
  });

  it("returns 404 when conversation does not exist for audio upload", async () => {
    (Conversation.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).post("/api/messages/nonexistent/audio").set(AUTH_HEADER);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Conversation not found");
  });
});
