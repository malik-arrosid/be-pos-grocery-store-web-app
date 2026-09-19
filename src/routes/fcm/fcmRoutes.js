import { Router } from "express";

import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { registerFcmToken, unregisterFcmToken } from "../../controllers/fcm/index.js";

const router = Router();
const ownerOnlyMiddlewares = [authenticate, authorize(["owner"])];

router.post("/register", ...ownerOnlyMiddlewares, registerFcmToken);
router.delete("/unregister", ...ownerOnlyMiddlewares, unregisterFcmToken);

export default router;