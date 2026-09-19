import express from "express";
const router = express.Router();

import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import {
  addBarangMasukBaru,
  addBarangMasukExisting,
  getBarangMasuk,
} from "../../controllers/barangMasuk/index.js";

router.post("/new", authenticate, authorize(["admin"]), addBarangMasukBaru);

router.post(
  "/existing",
  authenticate,
  authorize(["admin"]),
  addBarangMasukExisting,
);

router.get("/", authenticate, authorize(["admin", "owner"]), getBarangMasuk);

export default router;