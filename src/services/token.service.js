import jwt from "jsonwebtoken";
import config from "../config/config.js";

const AT_TTL = parseInt(config.app.accessTokenTTL || "900", 10);
const RT_TTL = parseInt(config.app.refreshTokenTTL || "604800", 10);
const JWT_ACCESS_SECRET = config.app.jwtAccessSecret || config.app.jwtSecret;
const JWT_REFRESH_SECRET = config.app.jwtRefreshSecret || config.app.jwtSecret;

if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error("JWT access/refresh secrets are not configured");
}

export function signAccessToken(payload) {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    algorithm: "HS256",
    expiresIn: AT_TTL,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_ACCESS_SECRET, { algorithms: ["HS256"] });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    algorithm: "HS256",
    expiresIn: RT_TTL,
  });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET, { algorithms: ["HS256"] });
}

export function getAccessExpiryDate() {
  return new Date(Date.now() + AT_TTL * 1000);
}

export function getRefreshExpiryDate() {
  return new Date(Date.now() + RT_TTL * 1000);
}