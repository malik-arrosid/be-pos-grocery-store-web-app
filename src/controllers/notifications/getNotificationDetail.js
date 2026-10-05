import { NOTIFICATION_TYPES } from "../../notifications/notification.types.js";
import {
  getDailyReportMetadataByDate,
  getNotificationById,
} from "../../notifications/notification.repository.js";
import { toNotificationResponse } from "./notificationResponse.js";

const getNotificationDetail = async (req, res) => {
  try {
    const { id_notification } = req.params;
    const notification = await getNotificationById(id_notification);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notifikasi tidak ditemukan",
      });
    }

    let reportDetail = null;
    if (notification.notification_type === NOTIFICATION_TYPES.REPORT_DAILY) {
      const reportDate =
        notification.metadata?.report_date ||
        new Date(notification.created_at).toISOString().split("T")[0];

      const hasRequiredMetadata =
        notification.metadata?.summary &&
        Array.isArray(notification.metadata?.daily_items) &&
        notification.metadata.daily_items.every((i) => "satuan_dasar" in i);

      reportDetail = hasRequiredMetadata
        ? notification.metadata
        : await getDailyReportMetadataByDate(reportDate);
    }

    return res.status(200).json({
      success: true,
      message: "Berhasil mendapatkan detail notifikasi",
      data: {
        ...toNotificationResponse(notification),
        report_detail: reportDetail,
      },
    });
  } catch (err) {
    console.error("Error getNotificationDetail:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export default getNotificationDetail;