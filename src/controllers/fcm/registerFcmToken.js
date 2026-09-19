import Joi from "joi";
import { upsertFcmToken } from "../../fcm/index.js";

const registerFcmToken = async (req, res) => {
  try {
    const schema = Joi.object({
      fcm_token: Joi.string().min(10).max(4096).required(),
      device_info: Joi.string().max(255).allow(null, "").optional(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const token = await upsertFcmToken({
      id_user: req.user.id_user,
      fcm_token: value.fcm_token,
      device_info: value.device_info || null,
    });

    return res.status(200).json({
      success: true,
      message: "FCM token berhasil didaftarkan",
      data: token,
    });
  } catch (err) {
    console.error("Error registerFcmToken:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export default registerFcmToken;