import { Router } from "express";
import { db } from "@workspace/db";
import { licensesTable, devicesTable, plansTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { logActivity } from "../lib/activity";
import { randomUUID } from "crypto";

const router = Router();

async function validateLicenseCore(licenseKey: string, deviceId: string, deviceInfo?: Record<string, unknown> | null) {
  const [license] = await db
    .select({ l: licensesTable, p: plansTable })
    .from(licensesTable)
    .leftJoin(plansTable, eq(licensesTable.planId, plansTable.id))
    .where(eq(licensesTable.key, licenseKey))
    .limit(1);

  if (!license) {
    return { valid: false, message: "License not found" };
  }

  const { l, p } = license;

  if (l.status === "revoked") return { valid: false, message: "License has been revoked", status: "revoked" };
  if (l.status === "suspended") return { valid: false, message: "License is suspended", status: "suspended" };
  if (l.status === "expired") return { valid: false, message: "License has expired", status: "expired" };

  if (l.expiresAt && new Date(l.expiresAt) < new Date()) {
    await db.update(licensesTable).set({ status: "expired" }).where(eq(licensesTable.id, l.id));
    return { valid: false, message: "License has expired", status: "expired" };
  }

  // Find or create device binding
  const [existingDevice] = await db
    .select()
    .from(devicesTable)
    .where(and(eq(devicesTable.licenseId, l.id), eq(devicesTable.deviceId, deviceId)))
    .limit(1);

  if (existingDevice) {
    await db
      .update(devicesTable)
      .set({ lastSeen: new Date(), isActive: true, ...(deviceInfo ? { deviceInfo } : {}) })
      .where(eq(devicesTable.id, existingDevice.id));
  } else {
    // Check device limit
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(devicesTable)
      .where(and(eq(devicesTable.licenseId, l.id), eq(devicesTable.isActive, true)));

    if (count >= l.maxDevices) {
      return { valid: false, message: `Device limit reached (${l.maxDevices} device${l.maxDevices !== 1 ? "s" : ""})`, status: l.status };
    }

    await db.insert(devicesTable).values({
      licenseId: l.id,
      deviceId,
      deviceInfo: deviceInfo ?? null,
      isActive: true,
    });

    if (!l.activatedAt) {
      await db.update(licensesTable).set({ activatedAt: new Date() }).where(eq(licensesTable.id, l.id));
    }
  }

  const sessionId = randomUUID();

  return {
    valid: true,
    message: "License valid",
    status: l.status,
    session_id: sessionId,
    user_name: l.userName ?? null,
    expires_at: l.expiresAt ? l.expiresAt.toISOString() : null,
    activated_at: l.activatedAt ? l.activatedAt.toISOString() : null,
    plan_name: p?.name ?? null,
    max_devices: l.maxDevices,
  };
}

router.post("/validate-license", async (req, res, next) => {
  try {
    const { license_key, device_id, device_info } = req.body as {
      license_key: string;
      device_id: string;
      device_info?: Record<string, unknown>;
    };
    if (!license_key || !device_id) {
      res.status(400).json({ valid: false, message: "license_key and device_id required" });
      return;
    }
    const result = await validateLicenseCore(license_key, device_id, device_info);
    await logActivity({
      action: result.valid ? "license_validated" : "license_validation_failed",
      licenseKey: license_key,
      deviceId: device_id,
      metadata: { valid: result.valid, message: result.message },
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/activate-license", async (req, res, next) => {
  try {
    const { license_key, device_id, device_info } = req.body as {
      license_key: string;
      device_id: string;
      device_info?: Record<string, unknown>;
    };
    if (!license_key || !device_id) {
      res.status(400).json({ valid: false, message: "license_key and device_id required" });
      return;
    }
    const result = await validateLicenseCore(license_key, device_id, device_info);
    await logActivity({
      action: result.valid ? "license_activated" : "license_activation_failed",
      licenseKey: license_key,
      deviceId: device_id,
      metadata: { valid: result.valid, message: result.message },
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/deactivate-license", async (req, res, next) => {
  try {
    const { license_key, device_id } = req.body as { license_key: string; device_id: string };
    if (!license_key || !device_id) {
      res.status(400).json({ success: false, message: "license_key and device_id required" });
      return;
    }
    const [license] = await db.select().from(licensesTable).where(eq(licensesTable.key, license_key)).limit(1);
    if (!license) {
      res.status(404).json({ success: false, message: "License not found" });
      return;
    }
    await db
      .update(devicesTable)
      .set({ isActive: false })
      .where(and(eq(devicesTable.licenseId, license.id), eq(devicesTable.deviceId, device_id)));
    await logActivity({ action: "license_deactivated", licenseKey: license_key, deviceId: device_id });
    res.json({ success: true, message: "Device deactivated" });
  } catch (err) {
    next(err);
  }
});

router.post("/check-license", async (req, res, next) => {
  try {
    const { license_key, device_id } = req.body as { license_key: string; device_id: string };
    if (!license_key || !device_id) {
      res.status(400).json({ valid: false, message: "license_key and device_id required" });
      return;
    }
    const result = await validateLicenseCore(license_key, device_id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
