import { NOTIFICATION_TYPES } from "../../notifications/notification.types.js";
import {
  getDailyReportMetadataByDate,
  getNotificationById,
} from "../../notifications/notification.repository.js";
import generateDailyReportNotificationPDF from "../../utils/generateDailyReportNotificationPDF.js";

const downloadDailyReportNotificationPdf = async (req, res) => {
  try {
    const { id_notification } = req.params;
    const notification = await getNotificationById(id_notification);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notifikasi tidak ditemukan",
      });
    }

    if (notification.notification_type !== NOTIFICATION_TYPES.REPORT_DAILY) {
      return res.status(400).json({
        success: false,
        message: "Unduhan PDF hanya tersedia untuk notifikasi REPORT_DAILY",
      });
    }

    const reportDate =
      notification.metadata?.report_date ||
      new Date(notification.created_at).toISOString().split("T")[0];

    const hasRequiredMetadata =
      notification.metadata?.summary &&
      Array.isArray(notification.metadata?.daily_items) &&
      notification.metadata.daily_items.every((i) => "satuan_dasar" in i);

    const reportData = hasRequiredMetadata
      ? notification.metadata
      : await getDailyReportMetadataByDate(reportDate);

    const pdfBuffer = await generateDailyReportNotificationPDF(reportData);

    return res
      .status(200)
      .set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="daily-report-${reportDate}.pdf"`,
      })
      .send(pdfBuffer);
  } catch (err) {
    console.error("Error downloadDailyReportNotificationPdf:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export default downloadDailyReportNotificationPdf;