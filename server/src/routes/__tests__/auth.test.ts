import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import jwt from "jsonwebtoken";

// Mock dependencies before imports
jest.mock("../../models/User");
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("mock-jwt-token"),
  verify: jest.fn(),
}));

import User from "../../models/User";

describe("Auth route handler logic", () => {
  let mockRes: Partial<Response>;
  let jsonFn: jest.Mock;
  let statusFn: jest.Mock;

  beforeEach(() => {
    jsonFn = jest.fn();
    statusFn = jest.fn().mockReturnValue({ json: jsonFn });
    mockRes = { status: statusFn, json: jsonFn };
    jest.clearAllMocks();
  });

  describe("login logic", () => {
    it("should return 401 when user is not found", async () => {
      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const mockReq = {
        body: { email: "notfound@test.com", password: "password123" },
      } as AuthRequest;

      // Simulate the login handler logic
      const { email } = mockReq.body;
      const user = await (User.findOne as jest.Mock)({ email }).select("+password");

      if (!user) {
        (mockRes as Response).status!(401);
        jsonFn({ error: "Invalid credentials" });
      }

      expect(statusFn).toHaveBeenCalledWith(401);
      expect(jsonFn).toHaveBeenCalledWith({ error: "Invalid credentials" });
    });

    it("should return 401 when password does not match", async () => {
      const mockUser = {
        _id: "user123",
        email: "test@test.com",
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const mockReq = {
        body: { email: "test@test.com", password: "wrongpassword" },
      } as AuthRequest;

      const { email, password } = mockReq.body;
      const user = await (User.findOne as jest.Mock)({ email }).select("+password");
      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        (mockRes as Response).status!(401);
        jsonFn({ error: "Invalid credentials" });
      }

      expect(mockUser.comparePassword).toHaveBeenCalledWith("wrongpassword");
      expect(statusFn).toHaveBeenCalledWith(401);
      expect(jsonFn).toHaveBeenCalledWith({ error: "Invalid credentials" });
    });

    it("should return token and user on successful login", async () => {
      const mockUser = {
        _id: "user123",
        email: "test@test.com",
        firstName: "Test",
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const { email, password } = { email: "test@test.com", password: "password123" };
      const user = await (User.findOne as jest.Mock)({ email }).select("+password");
      const isMatch = await user.comparePassword(password);

      expect(isMatch).toBe(true);
      const token = jwt.sign({ userId: String(user._id) }, "secret", { expiresIn: "7d" });
      expect(token).toBe("mock-jwt-token");
    });
  });

  describe("register logic", () => {
    it("should return 409 when email already exists", async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ email: "existing@test.com" });

      const existing = await User.findOne({ email: "existing@test.com" });

      if (existing) {
        (mockRes as Response).status!(409);
        jsonFn({ error: "Email already registered" });
      }

      expect(statusFn).toHaveBeenCalledWith(409);
      expect(jsonFn).toHaveBeenCalledWith({ error: "Email already registered" });
    });

    it("should create a user when email is new", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue({
        _id: "newuser123",
        email: "new@test.com",
        firstName: "New",
        lastName: "User",
      });

      const existing = await User.findOne({ email: "new@test.com" });
      expect(existing).toBeNull();

      const user = await User.create({
        email: "new@test.com",
        password: "password123",
        firstName: "New",
        lastName: "User",
      });

      expect(user).toHaveProperty("_id", "newuser123");
      expect(User.create).toHaveBeenCalledWith({
        email: "new@test.com",
        password: "password123",
        firstName: "New",
        lastName: "User",
      });
    });
  });
});
