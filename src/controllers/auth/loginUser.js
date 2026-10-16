import pool from "../../database/db.js";
import bcrypt from "bcrypt";
import {
  signAccessToken,
  signRefreshToken,
  getAccessExpiryDate,
  getRefreshExpiryDate,
} from "../../services/token.service.js";
import { createSession } from "../../services/session.service.js";
import config from "../../config/config.js";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { getCookieOptions } from "../../utils/cookieOptions.js";

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 3, // 3 percobaan/menit/username
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // req.ip already resolves to the original client IP when "trust proxy"
    // is configured, avoiding the raw multi-IP "x-forwarded-for" chain.
    const ip = ipKeyGenerator(req.ip) || req.socket.remoteAddress || "unknown";
    const username = req.body?.username || "unknown";
    return `${ip}:${username}`;
  },
  message: {
    success: false,
    message: "Terlalu banyak percobaan login. Silakan coba lagi dalam 1 menit.",
    error: "RATE_LIMIT_EXCEEDED",
    retryAfter: 60,
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Terlalu banyak percobaan login. Silakan coba lagi dalam 1 menit.",
      error: "RATE_LIMIT_EXCEEDED",
      retryAfter: 60,
    });
  },
});

const rolePathMap = {
  admin: "/api/admin",
  kasir: "/api/kasir",
  owner: "/api/owner",
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(`SELECT * FROM users WHERE username = $1`, [
      username,
    ]);
    const user = result.rows[0];

    if (!user)
      return res.status(401).json({ 
        success: false,
        message: "Username tidak ditemukan. Silakan periksa kembali username Anda.",
        error: "USERNAME_NOT_FOUND"
      });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ 
      success: false,
      message: "Password yang Anda masukkan salah. Silakan coba lagi.",
      error: "INVALID_PASSWORD"
    });

    const cookiePath = rolePathMap[user.role] || "/";

    const accessToken = signAccessToken({
      id_user: user.id_user,
      role: user.role,
      username: user.username,
    });

    const refreshToken = signRefreshToken({
      id_user: user.id_user,
      role: user.role,
      username: user.username,
    });
    const rtExp = getRefreshExpiryDate();
    const ua = req.get("user-agent");
    // req.ip yields a single client IP (resolved via "trust proxy"), unlike
    // the raw "x-forwarded-for" header which can contain a comma-separated
    // proxy chain (e.g. "117.18.17.106, 152.233.68.97") and is rejected by
    // the "inet" column type in Postgres.
    const ip = req.ip || req.socket.remoteAddress || null;

    const session = await createSession({
      userId: user.id_user,
      refreshToken,
      userAgent: ua,
      ip,
      expiresAt: rtExp,
    });

    const cookieConfig = getCookieOptions(cookiePath);
    
    console.log("Setting cookies with config:", {
      ...cookieConfig,
      domain: cookieConfig.domain || "NOT SET",
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
    });
    
    res.cookie(config.app.cookieNameAT || "access_token", accessToken, {
      ...cookieConfig,
      expires: getAccessExpiryDate(),
    });

    res.cookie(
      config.app.cookieNameRT || "refresh_token",
      `${session.session_id}.${refreshToken}`,
      {
        ...cookieConfig,
        path: cookiePath,
        expires: rtExp,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login berhasil",
      user: {
        id_user: user.id_user,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      success: false,
      message: "Terjadi kesalahan pada server. Silakan coba lagi nanti.",
      error: "SERVER_ERROR"
    });
  }
};

export { loginLimiter, loginUser };