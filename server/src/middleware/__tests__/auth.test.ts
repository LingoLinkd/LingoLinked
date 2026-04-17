// unit tests for the authenticate jwt middleware
import { authenticate, AuthRequest } from "../auth";
import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken");

describe("authenticate middleware", () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonFn: jest.Mock;
  let statusFn: jest.Mock;

  // fresh mock functions and request objects before each test
  beforeEach(() => {
    jsonFn = jest.fn();
    statusFn = jest.fn().mockReturnValue({ json: jsonFn });
    mockReq = { headers: {} };
    mockRes = { status: statusFn, json: jsonFn };
    mockNext = jest.fn();
  });

  it("returns 401 when no authorization header is present", () => {
    authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);
    expect(statusFn).toHaveBeenCalledWith(401);
    expect(jsonFn).toHaveBeenCalledWith({ error: "No token provided" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("returns 401 when header does not start with Bearer", () => {
    mockReq.headers = { authorization: "Token abc123" };
    authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);
    expect(statusFn).toHaveBeenCalledWith(401);
    expect(jsonFn).toHaveBeenCalledWith({ error: "No token provided" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("calls next and sets userId on valid token", () => {
    mockReq.headers = { authorization: "Bearer valid-token" };
    (jwt.verify as jest.Mock).mockReturnValue({ userId: "user123" });

    authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockReq.userId).toBe("user123");
    expect(mockNext).toHaveBeenCalled();
  });

  it("returns 401 on invalid token", () => {
    mockReq.headers = { authorization: "Bearer invalid-token" };
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("invalid");
    });

    authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(statusFn).toHaveBeenCalledWith(401);
    expect(jsonFn).toHaveBeenCalledWith({ error: "Invalid or expired token" });
  });
});
