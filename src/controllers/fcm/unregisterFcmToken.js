import Joi from "joi";
import { deleteFcmToken } from "../../fcm/index.js";

const unregisterFcmToken = async (req, res) => {
  try {
    const schema = Joi.object({
      fcm_token: Joi.string().min(10).max(4096).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    await deleteFcmToken({
      id_user: req.user.id_user,
      fcm_token: value.fcm_token,
    });

    return res.status(200).json({
      success: true,
      message: "FCM token berhasil dihapus",
    });
  } catch (err) {
    console.error("Error unregisterFcmToken:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export default unregisterFcmToken;