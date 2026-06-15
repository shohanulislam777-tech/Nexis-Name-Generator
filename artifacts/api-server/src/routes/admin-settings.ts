import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router = Router();
router.use(requireAdmin);

const DEFAULT_SETTINGS = {
  appName: "Nexis",
  supportUrl: null as string | null,
  defaultMaxDevices: 1,
  defaultTrialDays: 7,
  requireDeviceBinding: true,
  allowSelfDeactivation: true,
  heartbeatIntervalMinutes: 60,
};

async function getSettingValue(key: string): Promise<string | null> {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, key)).limit(1);
  return row?.value ?? null;
}

async function setSettingValue(key: string, value: string): Promise<void> {
  await db
    .insert(settingsTable)
    .values({ key, value })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value, updatedAt: new Date() } });
}

async function loadSettings() {
  const rows = await db.select().from(settingsTable);
  const map: Record<string, string> = {};
  rows.forEach((r) => { map[r.key] = r.value; });
  return {
    appName: map.appName ?? DEFAULT_SETTINGS.appName,
    supportUrl: map.supportUrl ?? DEFAULT_SETTINGS.supportUrl,
    defaultMaxDevices: map.defaultMaxDevices ? Number(map.defaultMaxDevices) : DEFAULT_SETTINGS.defaultMaxDevices,
    defaultTrialDays: map.defaultTrialDays ? Number(map.defaultTrialDays) : DEFAULT_SETTINGS.defaultTrialDays,
    requireDeviceBinding: map.requireDeviceBinding !== undefined ? map.requireDeviceBinding === "true" : DEFAULT_SETTINGS.requireDeviceBinding,
    allowSelfDeactivation: map.allowSelfDeactivation !== undefined ? map.allowSelfDeactivation === "true" : DEFAULT_SETTINGS.allowSelfDeactivation,
    heartbeatIntervalMinutes: map.heartbeatIntervalMinutes ? Number(map.heartbeatIntervalMinutes) : DEFAULT_SETTINGS.heartbeatIntervalMinutes,
  };
}

router.get("/admin/settings", async (_req, res, next) => {
  try {
    res.json(await loadSettings());
  } catch (err) {
    next(err);
  }
});

router.put("/admin/settings", async (req, res, next) => {
  try {
    const { appName, supportUrl, defaultMaxDevices, defaultTrialDays, requireDeviceBinding, allowSelfDeactivation, heartbeatIntervalMinutes } = req.body;
    const updates: [string, string][] = [];
    if (appName != null) updates.push(["appName", String(appName)]);
    if (supportUrl !== undefined) updates.push(["supportUrl", supportUrl ?? ""]);
    if (defaultMaxDevices != null) updates.push(["defaultMaxDevices", String(defaultMaxDevices)]);
    if (defaultTrialDays != null) updates.push(["defaultTrialDays", String(defaultTrialDays)]);
    if (requireDeviceBinding != null) updates.push(["requireDeviceBinding", String(requireDeviceBinding)]);
    if (allowSelfDeactivation != null) updates.push(["allowSelfDeactivation", String(allowSelfDeactivation)]);
    if (heartbeatIntervalMinutes != null) updates.push(["heartbeatIntervalMinutes", String(heartbeatIntervalMinutes)]);
    await Promise.all(updates.map(([k, v]) => setSettingValue(k, v)));
    res.json(await loadSettings());
  } catch (err) {
    next(err);
  }
});

export default router;
