import { revokeSession } from "../../services/session.service.js";
import config from "../../config/config.js";
import { getCookieOptions } from "../../utils/cookieOptions.js";

const logoutUser = async (req, res) => {
  const raw = req.cookies?.[config.app.cookieNameRT || "refresh_token"];
  if (raw) {
    const [sessionId] = raw.split(".");
    if (sessionId) await revokeSession(sessionId);
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