import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request { user?: any }
  }
}

export function auth(req: Request, res: Response, next: NextFunction) {
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ success: false, msg: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    req.user = decoded.user;
    next();
  } catch {
    return res.status(401).json({ success: false, msg: "Invalid token" });
  }
}
