import pool from "../database/db.js";

export const upsertFcmToken = async ({ id_user, fcm_token, device_info = null }) => {
  const query = `
    INSERT INTO fcm_tokens (id_user, fcm_token, device_info)
    VALUES ($1, $2, $3)
    ON CONFLICT (fcm_token)
    DO UPDATE SET
      id_user = EXCLUDED.id_user,
      device_info = EXCLUDED.device_info,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;

  const result = await pool.query(query, [id_user, fcm_token, device_info]);

  return result.rows[0];
};

export const deleteFcmToken = async ({ id_user, fcm_token }) => {
  const query = `
    DELETE FROM fcm_tokens
    WHERE id_user = $1 AND fcm_token = $2
    RETURNING *
  `;

  const result = await pool.query(query, [id_user, fcm_token]);

  return result.rows[0] || null;
};

export const deleteFcmTokensByValue = async (tokens) => {
  if (!tokens || tokens.length === 0) return 0;

  const query = `DELETE FROM fcm_tokens WHERE fcm_token = ANY($1::text[])`;

  const result = await pool.query(query, [tokens]);

  return result.rowCount;
};

export const getFcmTokensByRole = async (role) => {
  const query = `
    SELECT ft.id_fcm_token, ft.id_user, ft.fcm_token, ft.device_info
    FROM fcm_tokens ft
    JOIN users u ON u.id_user = ft.id_user
    WHERE u.role = $1
  `;

  const result = await pool.query(query, [role]);

  return result.rows;
};