import { getUnreadNotifications as getUnreadNotificationsRepository } from "../../notifications/notification.repository.js";
import { toNotificationResponse } from "./notificationResponse.js";

const getUnreadNotifications = async (req, res) => {
  try {
    const notifications = await getUnreadNotificationsRepository();

    if (!notifications || notifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tidak ada notifikasi yang belum dibaca",
        data: notifications,
      });
    }
    
    const normalizedNotifications = notifications.map(toNotificationResponse);

    return res.status(200).json({
      success: true,
      message: "Berhasil mendapatkan notifikasi yang belum dibaca",
      data: normalizedNotifications,
    });
  } catch (err) {
    console.error("Error getUnreadNotifications:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export default getUnreadNotifications;