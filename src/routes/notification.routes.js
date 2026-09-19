import { Router } from "express";

import {
  authenticate,
  authorize,
} from "../middlewares/auth.middleware.js";

import { notificationStream } from "../realtime/index.js";
import {
  getAllNotifications,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationDetail,
  downloadDailyReportNotificationPdf,
} from "../controllers/notifications/index.js";

const router = Router();
const ownerOnlyMiddlewares = [authenticate, authorize(["owner"])];

router.get(
  "/",
  ...ownerOnlyMiddlewares,
  getAllNotifications,
);

router.get(
  "/unread",
  ...ownerOnlyMiddlewares,
  getUnreadNotifications,
);

router.patch(
  "/read/:id_notification",
  ...ownerOnlyMiddlewares,
  markNotificationAsRead,
);

router.patch(
  "/read-all",
  ...ownerOnlyMiddlewares,
  markAllNotificationsAsRead,
);

router.get(
  "/stream",
  ...ownerOnlyMiddlewares,
  notificationStream,
);

router.get(
  "/:id_notification/download",
  ...ownerOnlyMiddlewares,
  downloadDailyReportNotificationPdf,
);

router.get(
  "/:id_notification",
  ...ownerOnlyMiddlewares,
  getNotificationDetail,
);

export default router;