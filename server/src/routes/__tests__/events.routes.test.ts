jest.mock("../../models/Event");
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
import Event from "../../models/Event";
import jwt from "jsonwebtoken";

const AUTH_HEADER = { Authorization: "Bearer test-token" };
const TEST_USER_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";
const ORGANIZER_ID = "bbbbbbbbbbbbbbbbbbbbbbbb";
const OTHER_USER_A = "cccccccccccccccccccccccc";
const OTHER_USER_B = "dddddddddddddddddddddddd";

const mockEvent = {
  _id: "event-1",
  title: "Spanish Practice",
  description: "Practice speaking Spanish",
  date: new Date("2026-06-01"),
  time: "14:00",
  location: "DCC 308",
  organizer: { toString: () => TEST_USER_ID },
  attendees: [{ toString: () => TEST_USER_ID }],
  language: "Spanish",
  maxAttendees: 10,
  save: jest.fn().mockResolvedValue(undefined),
  populate: jest.fn().mockImplementation(function (this: any) {
    return Promise.resolve(this);
  }),
};

beforeEach(() => {
  jest.clearAllMocks();
  (jwt.verify as jest.Mock).mockReturnValue({ userId: TEST_USER_ID });
});

// ─── GET /api/events ─────────────────────────────────────────────────────────

describe("GET /api/events", () => {
  it("returns list of upcoming events", async () => {
    const sortMock = jest.fn().mockResolvedValue([mockEvent]);
    const populate2Mock = jest.fn().mockReturnValue({ sort: sortMock });
    const populate1Mock = jest.fn().mockReturnValue({ populate: populate2Mock });
    (Event.find as jest.Mock).mockReturnValue({ populate: populate1Mock });

    const res = await request(app).get("/api/events").set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("events");
    expect(Array.isArray(res.body.events)).toBe(true);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/events");

    expect(res.status).toBe(401);
  });
});

// ─── GET /api/events/:id ─────────────────────────────────────────────────────

describe("GET /api/events/:id", () => {
  it("returns a single event by ID", async () => {
    const populate2Mock = jest.fn().mockResolvedValue(mockEvent);
    const populate1Mock = jest.fn().mockReturnValue({ populate: populate2Mock });
    (Event.findById as jest.Mock).mockReturnValue({ populate: populate1Mock });

    const res = await request(app).get("/api/events/event-1").set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("event");
  });

  it("returns 404 when event does not exist", async () => {
    const populate2Mock = jest.fn().mockResolvedValue(null);
    const populate1Mock = jest.fn().mockReturnValue({ populate: populate2Mock });
    (Event.findById as jest.Mock).mockReturnValue({ populate: populate1Mock });

    const res = await request(app).get("/api/events/nonexistent").set(AUTH_HEADER);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Event not found");
  });
});

// ─── POST /api/events ────────────────────────────────────────────────────────

describe("POST /api/events", () => {
  it("creates a new event successfully", async () => {
    const createdEvent = {
      ...mockEvent,
      populate: jest.fn().mockResolvedValue(mockEvent),
    };
    (Event.create as jest.Mock).mockResolvedValue(createdEvent);

    const res = await request(app).post("/api/events").set(AUTH_HEADER).send({
      title: "Spanish Practice",
      description: "Practice speaking Spanish",
      date: "2026-06-01",
      time: "14:00",
      location: "DCC 308",
      language: "Spanish",
      maxAttendees: 10,
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("event");
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/events")
      .set(AUTH_HEADER)
      .send({ title: "Spanish Practice" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Missing required fields");
  });
});

// ─── POST /api/events/:id/register ───────────────────────────────────────────

describe("POST /api/events/:id/register", () => {
  it("registers a user for an event", async () => {
    const attendees: any[] = [{ toString: () => ORGANIZER_ID }];
    const eventWithRoom = {
      _id: "event-1",
      title: "Spanish Practice",
      organizer: { toString: () => ORGANIZER_ID },
      attendees,
      maxAttendees: 10,
      save: jest.fn().mockResolvedValue(undefined),
    };

    (Event.findById as jest.Mock)
      .mockResolvedValueOnce(eventWithRoom) // first call for finding the event
      .mockReturnValueOnce({
        // second call for populated response
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue({ ...eventWithRoom }),
        }),
      });

    const res = await request(app).post("/api/events/event-1/register").set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("event");
  });

  it("returns 409 when user is already registered", async () => {
    const eventAlreadyRegistered = {
      _id: "event-1",
      attendees: [{ toString: () => TEST_USER_ID }],
      maxAttendees: 10,
      organizer: { toString: () => ORGANIZER_ID },
      save: jest.fn(),
    };
    (Event.findById as jest.Mock).mockResolvedValue(eventAlreadyRegistered);

    const res = await request(app).post("/api/events/event-1/register").set(AUTH_HEADER);

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("error", "Already registered");
  });

  it("returns 400 when event is full", async () => {
    const fullEvent = {
      _id: "event-1",
      attendees: [{ toString: () => OTHER_USER_A }, { toString: () => OTHER_USER_B }],
      maxAttendees: 2,
      organizer: { toString: () => OTHER_USER_A },
      save: jest.fn(),
    };
    (Event.findById as jest.Mock).mockResolvedValue(fullEvent);

    const res = await request(app).post("/api/events/event-1/register").set(AUTH_HEADER);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Event is full");
  });

  it("returns 404 when event does not exist", async () => {
    (Event.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).post("/api/events/nonexistent/register").set(AUTH_HEADER);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Event not found");
  });
});

// ─── DELETE /api/events/:id/register ─────────────────────────────────────────

describe("DELETE /api/events/:id/register", () => {
  it("unregisters a user from an event", async () => {
    const eventWithUser = {
      _id: "event-1",
      organizer: { toString: () => ORGANIZER_ID },
      attendees: [{ toString: () => ORGANIZER_ID }, { toString: () => TEST_USER_ID }],
      maxAttendees: 10,
      save: jest.fn().mockResolvedValue(undefined),
    };

    (Event.findById as jest.Mock).mockResolvedValueOnce(eventWithUser).mockReturnValueOnce({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...eventWithUser,
          attendees: [{ toString: () => ORGANIZER_ID }],
        }),
      }),
    });

    const res = await request(app).delete("/api/events/event-1/register").set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("event");
    expect(eventWithUser.save).toHaveBeenCalled();
  });

  it("returns 400 when organizer tries to unregister", async () => {
    const eventOrganizerIsSelf = {
      _id: "event-1",
      organizer: { toString: () => TEST_USER_ID },
      attendees: [{ toString: () => TEST_USER_ID }],
      maxAttendees: 10,
      save: jest.fn(),
    };
    (Event.findById as jest.Mock).mockResolvedValue(eventOrganizerIsSelf);

    const res = await request(app).delete("/api/events/event-1/register").set(AUTH_HEADER);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Organizer cannot unregister");
  });

  it("returns 404 when event does not exist for unregister", async () => {
    (Event.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).delete("/api/events/nonexistent/register").set(AUTH_HEADER);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Event not found");
  });
});
