import {
  getAllNotifications as getAllNotificationsRepository,
  getNotificationsCount,
  getUnreadNotificationsCount,
} from "../../notifications/notification.repository.js";
import { toNotificationResponse } from "./notificationResponse.js";

const getAllNotifications = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const pageNum = Number(page);
    const limitNum = 10;

    if (!Number.isInteger(pageNum) || pageNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "Parameter page harus berupa angka bulat lebih dari 0",
      });
    }

    const offset = (pageNum - 1) * limitNum;
    const notifications = await getAllNotificationsRepository({
      limit: limitNum,
      offset,
    });
    const normalizedNotifications = notifications.map(toNotificationResponse);
    const [total_data, total_unread_notifications] = await Promise.all([
      getNotificationsCount(),
      getUnreadNotificationsCount(),
    ]);

    return res.status(200).json({
      success: true,
      message: "Berhasil mendapatkan semua notifikasi",
      meta: {
        page: pageNum,
        limit: limitNum,
        total_data,
        total_page: Math.ceil(total_data / limitNum),
        total_unread_notifications,
      },
      data: normalizedNotifications,
    });
  } catch (err) {
    console.error("Error getAllNotifications:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export default getAllNotifications;