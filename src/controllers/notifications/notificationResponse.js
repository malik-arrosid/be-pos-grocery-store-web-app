import { NOTIFICATION_TYPES } from "../../notifications/notification.types.js";
import { normalizeNotificationMetadata } from "../../notifications/notification.utils.js";

export const toNotificationResponse = (notification) => {
  if (!notification) return null;

  const isReportDaily =
    notification.notification_type === NOTIFICATION_TYPES.REPORT_DAILY;

  return {
    ...notification,
    metadata: normalizeNotificationMetadata(
      notification.notification_type,
      notification.metadata,
    ),
    can_download_pdf: isReportDaily,
    download_pdf_endpoint: isReportDaily
      ? `/api/owner/notifications/${notification.id_notification}/download`
      : null,
  };
};