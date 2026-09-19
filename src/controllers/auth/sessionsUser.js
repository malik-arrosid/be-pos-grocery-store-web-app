import {
  listUserSessions,
  revokeSession,
} from "../../services/session.service.js";

export const listMySessions = async (req, res) => {
  const sessions = await listUserSessions(req.user.id_user);
  return res.status(200).json({ success: true, data: sessions });
};

export const revokeMySession = async (req, res) => {
  const { session_id } = req.params;
  await revokeSession(session_id);
  return res.status(200).json({ success: true });
};
