import { markAllAsRead } from "../../notifications/notification.repository.js";

const markAllNotificationsAsRead = async (req, res) => {
  try {
    await markAllAsRead();

    return res.status(200).json({
      success: true,
      message: "Berhasil menandai semua notifikasi sebagai dibaca",
    });
  } catch (err) {
    console.error("Error markAllNotificationsAsRead:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export default markAllNotificationsAsRead;