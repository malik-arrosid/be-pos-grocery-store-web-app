import jwt from "jsonwebtoken";
import crypto from "crypto";
import config from "../config/config.js";

const AT_TTL = parseInt(config.app.accessTokenTTL || "900", 10);
const RT_TTL = parseInt(config.app.refreshTokenTTL || "1209600", 10);

export function signAccessToken(payload) {
  return jwt.sign(payload, config.app.jwtSecret, { expiresIn: AT_TTL }); // 15 m
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.app.jwtSecret);
}

export function makeRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

export function getAccessExpiryDate() {
  return new Date(Date.now() + AT_TTL * 1000);
}

export function getRefreshExpiryDate() {
  return new Date(Date.now() + RT_TTL * 1000);
}