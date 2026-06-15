import { createHmac, randomBytes } from "crypto";
import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { adminsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.SESSION_SECRET || "nexis-dev-secret-change-in-prod";

function base64url(str: string): string {
  return Buffer.from(str).toString("base64url");
}

function signToken(payload: object): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }));
  const sig = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

function verifyToken(token: string): Record<string, unknown> | null {
  try {
    const [header, body, sig] = token.split(".");
    const expected = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createAdminToken(adminId: number, username: string): string {
  return signToken({ adminId, username, exp: Math.floor(Date.now() / 1000) + 86400 * 7 });
}

export function hashPassword(password: string): string {
  const salt = "nexis-salt-v1";
  return createHmac("sha256", salt).update(password).digest("hex");
}

export function generateLicenseKey(): string {
  const segment = () => randomBytes(3).toString("hex").toUpperCase();
  return `NEXIS-${segment()}-${segment()}-${segment()}-${segment()}`;
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (!payload || typeof payload.adminId !== "number") {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }
    const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.id, payload.adminId)).limit(1);
    if (!admin) {
      res.status(401).json({ error: "Admin not found" });
      return;
    }
    (req as Request & { admin: typeof admin }).admin = admin;
    next();
  } catch (err) {
    next(err);
  }
}
