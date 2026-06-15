import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { sql, desc } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router = Router();
router.use(requireAdmin);

router.get("/admin/notifications", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const offset = (page - 1) * limit;

    const rows = await db.select().from(notificationsTable).orderBy(desc(notificationsTable.createdAt)).limit(limit).offset(offset);
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(notificationsTable);

    res.json({
      data: rows.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/admin/notifications", async (req, res, next) => {
  try {
    const { title, message, type } = req.body;
    const [notif] = await db.insert(notificationsTable).values({ title, message, type: type ?? "info" }).returning();
    res.status(201).json({
      id: notif.id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      isRead: notif.isRead,
      createdAt: notif.createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
