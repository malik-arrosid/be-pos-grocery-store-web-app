import pool from "../../database/db.js";
import {
  matchRefreshToken,
  rotateSession,
  getSessionById,
  revokeAllUserSessions,
} from "../../services/session.service.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getAccessExpiryDate,
  getRefreshExpiryDate,
} from "../../services/token.service.js";
import config from "../../config/config.js";
import { getCookieOptions } from "../../utils/cookieOptions.js";

const COOKIE_AT = config.app.cookieNameAT || "access_token";
const COOKIE_RT = config.app.cookieNameRT || "refresh_token";

function clearAuthCookies(res, path) {
  const cookieConfig = getCookieOptions(path);
  res.clearCookie(COOKIE_AT, { ...cookieConfig, path });
  res.clearCookie(COOKIE_RT, { ...cookieConfig, path });
}

function sendError(res, status, code, message, extras = {}) {
  return res.status(status).json({
    success: false,
    error: { code, message, ...extras },
  });
}

const refreshToken = async (req, res) => {
  const cookiePath = req.baseUrl || "/";

  try {
    const raw = req.cookies?.[COOKIE_RT];
    if (!raw) {
      res.set("WWW-Authenticate", "******'invalid_token'");
      return sendError(
        res,
        401,
        "MISSING_REFRESH_TOKEN",
        "Missing refresh token"
      );
    }

    const separatorIndex = raw.indexOf(".");
    const sessionId = separatorIndex >= 0 ? raw.slice(0, separatorIndex) : null;
    const presented = separatorIndex >= 0 ? raw.slice(separatorIndex + 1) : null;

    if (!sessionId || !presented) {
      clearAuthCookies(res, cookiePath);
      res.set("WWW-Authenticate", "******'invalid_token'");
      return sendError(
        res,
        401,
        "INVALID_REFRESH_FORMAT",
        "Invalid refresh token"
      );
    }

    let decodedRefresh;
    try {
      decodedRefresh = verifyRefreshToken(presented);
    } catch {
      clearAuthCookies(res, cookiePath);
      res.set("WWW-Authenticate", "******'invalid_token'");
      return sendError(
        res,
        401,
        "INVALID_REFRESH_TOKEN",
        "Invalid refresh token"
      );
    }

    const sess = await getSessionById(sessionId);
    if (!sess) {
      clearAuthCookies(res, cookiePath);
      res.set("WWW-Authenticate", "******'invalid_token'");
      return sendError(res, 401, "SESSION_NOT_FOUND", "Session not found");
    }

    if (decodedRefresh.id_user !== sess.user_id) {
      clearAuthCookies(res, cookiePath);
      res.set("WWW-Authenticate", "******'invalid_token'");
      return sendError(
        res,
        401,
        "REFRESH_SESSION_MISMATCH",
        "Refresh token does not match session"
      );
    }

    const match = await matchRefreshToken(sessionId, presented);
    if (!match.ok) {
      if (sess.user_id && match.reason === "MISMATCH") {
        try {
          await revokeAllUserSessions(sess.user_id);
        } catch (e) {
          console.error("Failed to revoke all sessions on refresh token reuse:", e);
        }
      }
      clearAuthCookies(res, cookiePath);

      const reasonToCode = {
        NOT_FOUND: "REFRESH_NOT_FOUND",
        REVOKED: "SESSION_REVOKED",
        EXPIRED: "SESSION_EXPIRED",
        MISMATCH: "REFRESH_MISMATCH",
      };
      const reasonToMsg = {
        NOT_FOUND: "Refresh token not found",
        REVOKED: "Session has been revoked",
        EXPIRED: "Session has expired",
        MISMATCH: "Refresh token mismatch (possible reuse)",
      };
      const code = reasonToCode[match.reason] || "SESSION_INVALID";
      const msg = reasonToMsg[match.reason] || "Invalid/Expired session";

      const status = match.reason === "REVOKED" ? 403 : 401;
      res.set("WWW-Authenticate", "******'invalid_token'");
      return sendError(res, status, code, msg, { reason: match.reason });
    }

    const { rows } = await pool.query(
      `SELECT id_user, username, role FROM users WHERE id_user = $1`,
      [sess.user_id]
    );
    const user = rows[0];
    if (!user) {
      clearAuthCookies(res, cookiePath);
      res.set("WWW-Authenticate", "******'invalid_token'");
      return sendError(res, 401, "USER_NOT_FOUND", "User tidak valid");
    }

    const newAT = signAccessToken({
      id_user: user.id_user,
      role: user.role,
      username: user.username,
    });

    const newRT = signRefreshToken({
      id_user: user.id_user,
      role: user.role,
      username: user.username,
    });
    const rtExp = getRefreshExpiryDate();

    try {
      await rotateSession(sessionId, newRT, rtExp);
    } catch {
      return sendError(res, 500, "ROTATE_FAILED", "Failed to rotate session");
    }

    const cookieConfig = getCookieOptions(cookiePath);
    res.cookie(COOKIE_AT, newAT, {
      ...cookieConfig,
      expires: getAccessExpiryDate(),
    });
    res.cookie(COOKIE_RT, `${sessionId}.${newRT}`, {
      ...cookieConfig,
      expires: rtExp,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("refreshToken fatal error:", err);
    return sendError(res, 500, "INTERNAL_ERROR", "Server Error");
  }
};

export default refreshToken;
