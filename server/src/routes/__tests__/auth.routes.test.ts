jest.mock("../../models/User");
jest.mock("jsonwebtoken");

import request from "supertest";
import app from "../../app";
import User from "../../models/User";
import jwt from "jsonwebtoken";

const AUTH_HEADER = { Authorization: "Bearer test-token" };

const mockUser = {
  _id: "test-user-id",
  email: "test@rpi.edu",
  firstName: "Test",
  lastName: "User",
  toJSON() {
    return { _id: this._id, email: this.email, firstName: this.firstName, lastName: this.lastName };
  },
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── REGISTER ────────────────────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  it("returns 201 with token and user on successful registration", async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    (User.create as jest.Mock).mockResolvedValue(mockUser);
    (jwt.sign as jest.Mock).mockReturnValue("test-token");

    const res = await request(app).post("/api/auth/register").send({
      email: "test@rpi.edu",
      password: "password123",
      firstName: "Test",
      lastName: "User",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token", "test-token");
    expect(res.body).toHaveProperty("user");
  });

  it("returns 409 when email is already registered", async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(app).post("/api/auth/register").send({
      email: "test@rpi.edu",
      password: "password123",
      firstName: "Test",
      lastName: "User",
    });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("error", "Email already registered");
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "test@rpi.edu" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("errors");
  });

  it("returns 400 when password is too short", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "test@rpi.edu",
      password: "short",
      firstName: "Test",
      lastName: "User",
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("errors");
  });

  it("returns 400 when email is invalid", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "not-an-email",
      password: "password123",
      firstName: "Test",
      lastName: "User",
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("errors");
  });
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  it("returns 200 with token on valid credentials", async () => {
    const mockUserWithPassword = {
      ...mockUser,
      password: "hashed",
      comparePassword: jest.fn().mockResolvedValue(true),
    };

    (User.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUserWithPassword),
    });
    (jwt.sign as jest.Mock).mockReturnValue("test-token");

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@rpi.edu", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token", "test-token");
    expect(res.body).toHaveProperty("user");
  });

  it("returns 401 when user is not found", async () => {
    (User.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "missing@rpi.edu", password: "password123" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Invalid credentials");
  });

  it("returns 401 when password does not match", async () => {
    const mockUserBadPass = {
      ...mockUser,
      password: "hashed",
      comparePassword: jest.fn().mockResolvedValue(false),
    };

    (User.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUserBadPass),
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@rpi.edu", password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Invalid credentials");
  });

  it("returns 400 when email or password is missing", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "test@rpi.edu" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("errors");
  });
});

// ─── GET /me ─────────────────────────────────────────────────────────────────

describe("GET /api/auth/me", () => {
  it("returns 200 with user when authenticated", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ userId: "test-user-id" });
    (User.findById as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(app).get("/api/auth/me").set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("user");
  });

  it("returns 401 when no token is provided", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "No token provided");
  });

  it("returns 404 when authenticated user is not found in database", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ userId: "test-user-id" });
    (User.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get("/api/auth/me").set(AUTH_HEADER);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "User not found");
  });
});
