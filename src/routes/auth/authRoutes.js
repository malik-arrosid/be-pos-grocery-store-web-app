import express from "express";
const router = express.Router();
import {
  registerUser,
  loginLimiter,
  loginUser,
} from "../../controllers/auth/index.js";

router.post("/register", registerUser);
router.post("/login", loginLimiter, loginUser);

export default router;
