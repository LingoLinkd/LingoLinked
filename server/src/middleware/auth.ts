import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
}

// validates the bearer token from the authorization header and attaches the user id to the request
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  // extract the raw token string after "bearer "
  const token = header.split(" ")[1];
  const secret = process.env.JWT_SECRET || "dev-secret-change-me";

  try {
    // verify signature and decode the user id from the payload
    const payload = jwt.verify(token, secret) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
