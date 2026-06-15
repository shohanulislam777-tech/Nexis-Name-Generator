import { Router } from "express";
import { db } from "@workspace/db";
import { adminsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createAdminToken, hashPassword, requireAdmin } from "../lib/auth";

const router = Router();

router.post("/auth/login", async (req, res, next) => {
  try {
    const { username, password } = req.body as { username: string; password: string };
    if (!username || !password) {
      res.status(400).json({ error: "Username and password required" });
      return;
    }
    const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.username, username)).limit(1);
    if (!admin || admin.passwordHash !== hashPassword(password)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = createAdminToken(admin.id, admin.username);
    res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        createdAt: admin.createdAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/auth/logout", (_req, res) => {
  res.json({ success: true, message: "Logged out" });
});

router.get("/auth/me", requireAdmin, (req, res) => {
  const admin = (req as Request & { admin: { id: number; username: string; email: string; createdAt: Date } }).admin;
  res.json({
    id: admin.id,
    username: admin.username,
    email: admin.email,
    createdAt: admin.createdAt.toISOString(),
  });
});

export default router;
