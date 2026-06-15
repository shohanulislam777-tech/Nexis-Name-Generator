import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import licensePublicRouter from "./license-public";
import adminLicensesRouter from "./admin-licenses";
import adminPlansRouter from "./admin-plans";
import adminUsersRouter from "./admin-users";
import adminDevicesRouter from "./admin-devices";
import adminNotificationsRouter from "./admin-notifications";
import adminAnalyticsRouter from "./admin-analytics";
import adminLogsRouter from "./admin-logs";
import adminSettingsRouter from "./admin-settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(licensePublicRouter);
router.use(adminLicensesRouter);
router.use(adminPlansRouter);
router.use(adminUsersRouter);
router.use(adminDevicesRouter);
router.use(adminNotificationsRouter);
router.use(adminAnalyticsRouter);
router.use(adminLogsRouter);
router.use(adminSettingsRouter);

export default router;
