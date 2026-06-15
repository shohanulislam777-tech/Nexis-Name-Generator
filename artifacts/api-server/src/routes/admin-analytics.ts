import { Router } from "express";
import { db } from "@workspace/db";
import { licensesTable, devicesTable, plansTable, activityLogsTable } from "@workspace/db";
import { eq, sql, desc, gte, and } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router = Router();
router.use(requireAdmin);

router.get("/admin/analytics/dashboard", async (_req, res, next) => {
  try {
    const [licenseStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where status = 'active')::int`,
        suspended: sql<number>`count(*) filter (where status = 'suspended')::int`,
        revoked: sql<number>`count(*) filter (where status = 'revoked')::int`,
        expired: sql<number>`count(*) filter (where status = 'expired')::int`,
        trial: sql<number>`count(*) filter (where status = 'trial')::int`,
      })
      .from(licensesTable);

    const [deviceStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where is_active = true)::int`,
      })
      .from(devicesTable);

    const [planCount] = await db.select({ total: sql<number>`count(*)::int` }).from(plansTable);

    const [{ userCount }] = await db
      .select({ userCount: sql<number>`count(distinct coalesce(user_email, ''))::int` })
      .from(licensesTable)
      .where(sql`user_email is not null`);

    const [{ revenue }] = await db
      .select({ revenue: sql<number>`coalesce(sum(p.price), 0)::float` })
      .from(licensesTable)
      .leftJoin(plansTable, eq(licensesTable.planId, plansTable.id));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [{ activationsToday }] = await db
      .select({ activationsToday: sql<number>`count(*)::int` })
      .from(activityLogsTable)
      .where(and(eq(activityLogsTable.action, "license_activated"), gte(activityLogsTable.createdAt, today)));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [{ recentActivations }] = await db
      .select({ recentActivations: sql<number>`count(*)::int` })
      .from(activityLogsTable)
      .where(and(eq(activityLogsTable.action, "license_activated"), gte(activityLogsTable.createdAt, thirtyDaysAgo)));

    const recentActivity = await db.select().from(activityLogsTable).orderBy(desc(activityLogsTable.createdAt)).limit(10);

    res.json({
      totalLicenses: licenseStats.total,
      activeLicenses: licenseStats.active,
      suspendedLicenses: licenseStats.suspended,
      revokedLicenses: licenseStats.revoked,
      expiredLicenses: licenseStats.expired,
      trialLicenses: licenseStats.trial,
      totalDevices: deviceStats.total,
      activeDevices: deviceStats.active,
      totalPlans: planCount.total,
      totalUsers: userCount,
      totalRevenue: revenue,
      recentActivations,
      activationsToday,
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        action: a.action,
        licenseId: a.licenseId,
        licenseKey: a.licenseKey,
        deviceId: a.deviceId,
        adminId: a.adminId,
        metadata: a.metadata,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/admin/analytics/trends", async (_req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activations = await db
      .select({
        date: sql<string>`date_trunc('day', created_at)::date::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(activityLogsTable)
      .where(and(gte(activityLogsTable.createdAt, thirtyDaysAgo), eq(activityLogsTable.action, "license_activated")))
      .groupBy(sql`date_trunc('day', created_at)::date`);

    const validations = await db
      .select({
        date: sql<string>`date_trunc('day', created_at)::date::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(activityLogsTable)
      .where(and(gte(activityLogsTable.createdAt, thirtyDaysAgo), eq(activityLogsTable.action, "license_validated")))
      .groupBy(sql`date_trunc('day', created_at)::date`);

    const newLicenses = await db
      .select({
        date: sql<string>`date_trunc('day', created_at)::date::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(licensesTable)
      .where(gte(licensesTable.createdAt, thirtyDaysAgo))
      .groupBy(sql`date_trunc('day', created_at)::date`);

    // Build 30-day series
    const dateMap: Record<string, { activations: number; validations: number; newLicenses: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dateMap[key] = { activations: 0, validations: 0, newLicenses: 0 };
    }
    activations.forEach((r) => { if (dateMap[r.date]) dateMap[r.date].activations = r.count; });
    validations.forEach((r) => { if (dateMap[r.date]) dateMap[r.date].validations = r.count; });
    newLicenses.forEach((r) => { if (dateMap[r.date]) dateMap[r.date].newLicenses = r.count; });

    res.json(Object.entries(dateMap).map(([date, v]) => ({ date, ...v })));
  } catch (err) {
    next(err);
  }
});

router.get("/admin/analytics/revenue", async (_req, res, next) => {
  try {
    const rows = await db
      .select({
        planName: plansTable.name,
        licenseCount: sql<number>`count(${licensesTable.id})::int`,
        revenue: sql<number>`coalesce(sum(${plansTable.price}), 0)::float`,
      })
      .from(licensesTable)
      .leftJoin(plansTable, eq(licensesTable.planId, plansTable.id))
      .where(sql`${licensesTable.planId} is not null`)
      .groupBy(plansTable.name);
    res.json(rows.map((r) => ({ planName: r.planName ?? "Unknown", licenseCount: r.licenseCount, revenue: r.revenue })));
  } catch (err) {
    next(err);
  }
});

export default router;
