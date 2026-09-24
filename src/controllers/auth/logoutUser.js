import { revokeSession } from "../../services/session.service.js";
import config from "../../config/config.js";
import { getCookieOptions } from "../../utils/cookieOptions.js";
import { deleteFcmToken } from "../../fcm/index.js";

const logoutUser = async (req, res) => {
  const raw = req.cookies?.[config.app.cookieNameRT || "refresh_token"];
  if (raw) {
    const [sessionId] = raw.split(".");
    if (sessionId) await revokeSession(sessionId);
  }

  // Jaring pengaman: hapus juga token FCM device ini kalau dikirim oleh
  // client, untuk berjaga-jaga bila panggilan unregister khusus dari
  // frontend sebelumnya gagal (mis. karena masalah jaringan). Tanpa ini,
  // device yang sudah logout bisa tetap menerima notifikasi heads-up.
  const fcmToken = req.body?.fcm_token;
  if (fcmToken && req.user?.id_user) {
    await deleteFcmToken({ id_user: req.user.id_user, fcm_token: fcmToken }).catch(
      (error) => console.error("Gagal menghapus FCM token saat logout:", error.message),
    );
  }

  const cookiePath = req.baseUrl || "/";
  const cookieOptions = getCookieOptions(cookiePath);

  res.clearCookie(config.app.cookieNameAT || "access_token", {
    ...cookieOptions,
  });
  res.clearCookie(config.app.cookieNameRT || "refresh_token", {
    ...cookieOptions,
  });
  
  return res.status(200).json({ success: true, message: "Logout berhasil" });
};

export default logoutUser;