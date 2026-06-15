import { Router } from "express";
import { db } from "@workspace/db";
import { plansTable, licensesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router = Router();
router.use(requireAdmin);

function fmtPlan(p: typeof plansTable.$inferSelect, licenseCount = 0) {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    price: Number(p.price),
    currency: p.currency,
    durationDays: p.durationDays ?? null,
    maxDevices: p.maxDevices,
    isActive: p.isActive,
    licenseCount,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/admin/plans", async (_req, res, next) => {
  try {
    const rows = await db
      .select({ p: plansTable, licenseCount: sql<number>`count(${licensesTable.id})::int` })
      .from(plansTable)
      .leftJoin(licensesTable, eq(licensesTable.planId, plansTable.id))
      .groupBy(plansTable.id);
    res.json(rows.map((r) => fmtPlan(r.p, r.licenseCount)));
  } catch (err) {
    next(err);
  }
});

router.post("/admin/plans", async (req, res, next) => {
  try {
    const { name, description, price, currency, durationDays, maxDevices, isActive } = req.body;
    const [plan] = await db
      .insert(plansTable)
      .values({ name, description, price: String(price ?? 0), currency: currency ?? "USD", durationDays, maxDevices: maxDevices ?? 1, isActive: isActive ?? true })
      .returning();
    res.status(201).json(fmtPlan(plan));
  } catch (err) {
    next(err);
  }
});

router.get("/admin/plans/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [row] = await db
      .select({ p: plansTable, licenseCount: sql<number>`count(${licensesTable.id})::int` })
      .from(plansTable)
      .leftJoin(licensesTable, eq(licensesTable.planId, plansTable.id))
      .where(eq(plansTable.id, id))
      .groupBy(plansTable.id);
    if (!row) { res.status(404).json({ error: "Plan not found" }); return; }
    res.json(fmtPlan(row.p, row.licenseCount));
  } catch (err) {
    next(err);
  }
});

router.put("/admin/plans/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, description, price, currency, durationDays, maxDevices, isActive } = req.body;
    const update: Partial<typeof plansTable.$inferInsert> = {};
    if (name != null) update.name = name;
    if (description !== undefined) update.description = description;
    if (price != null) update.price = String(price);
    if (currency != null) update.currency = currency;
    if (durationDays !== undefined) update.durationDays = durationDays;
    if (maxDevices != null) update.maxDevices = maxDevices;
    if (isActive != null) update.isActive = isActive;
    update.updatedAt = new Date();
    const [updated] = await db.update(plansTable).set(update).where(eq(plansTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Plan not found" }); return; }
    res.json(fmtPlan(updated));
  } catch (err) {
    next(err);
  }
});

router.delete("/admin/plans/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [deleted] = await db.delete(plansTable).where(eq(plansTable.id, id)).returning();
    if (!deleted) { res.status(404).json({ error: "Plan not found" }); return; }
    res.json({ success: true, message: "Plan deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
