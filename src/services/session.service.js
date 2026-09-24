import bcrypt from "bcrypt";
import pool from "../database/db.js";

async function createSession({
  userId,
  refreshToken,
  userAgent,
  ip,
  expiresAt,
}) {
  const hash = await bcrypt.hash(refreshToken, 12);
  const { rows } = await pool.query(
    `INSERT INTO user_sessions (user_id, refresh_hash, user_agent, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING session_id, user_id, created_at, expires_at`,
    [userId, hash, userAgent || null, ip || null, expiresAt]
  );
  return rows[0];
}

async function getSessionById(sessionId) {
  const { rows } = await pool.query(
    `SELECT session_id, user_id, refresh_hash, revoked_at, expires_at
   FROM user_sessions
   WHERE session_id = $1`,
    [sessionId]
  );
  return rows[0] || null;
}

async function matchRefreshToken(sessionId, refreshToken) {
  const { rows } = await pool.query(
    `SELECT refresh_hash, revoked_at, expires_at FROM user_sessions WHERE session_id = $1`,
    [sessionId]
  );
  if (!rows[0]) return { ok: false, reason: "NOT_FOUND" };
  const s = rows[0];
  if (s.revoked_at) return { ok: false, reason: "REVOKED" };
  if (new Date(s.expires_at) < new Date())
    return { ok: false, reason: "EXPIRED" };
  const ok = await bcrypt.compare(refreshToken, s.refresh_hash);
  return ok ? { ok: true } : { ok: false, reason: "MISMATCH" };
}

async function rotateSession(sessionId, newRefreshToken, newExpiresAt) {
  const hash = await bcrypt.hash(newRefreshToken, 12);
  await pool.query(
    `UPDATE user_sessions
     SET refresh_hash = $1, expires_at = $2
     WHERE session_id = $3`,
    [hash, newExpiresAt, sessionId]
  );
}

async function revokeSession(sessionId) {
  await pool.query(
    `UPDATE user_sessions SET revoked_at = NOW() WHERE session_id = $1 AND revoked_at IS NULL`,
    [sessionId]
  );
}

async function revokeAllUserSessions(userId) {
  await pool.query(
    `UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
}

async function listUserSessions(userId) {
  const { rows } = await pool.query(
    `SELECT session_id, user_agent, ip_address, created_at, expires_at, revoked_at
     FROM user_sessions
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

export { createSession, getSessionById, matchRefreshToken, rotateSession, revokeSession, revokeAllUserSessions, listUserSessions };