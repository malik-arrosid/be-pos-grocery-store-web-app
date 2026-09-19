import { markAsRead } from "../../notifications/notification.repository.js";

const markNotificationAsRead = async (req, res) => {
  try {
    const id_notification = req.params.id_notification;
    const notification = await markAsRead(id_notification);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notifikasi tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Berhasil menandai notifikasi sebagai dibaca",
      data: notification,
    });
  } catch (err) {
    console.error("Error markNotificationAsRead:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export default markNotificationAsRead;