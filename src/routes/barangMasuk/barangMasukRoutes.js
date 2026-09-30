import express from "express";
const router = express.Router();

import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import {
  addBarangMasukBaru,
  addBarangMasukExisting,
  getBarangMasuk,
  searchBarangMasukByNama,
} from "../../controllers/barangMasuk/index.js";

router.post("/new", authenticate, authorize(["admin"]), addBarangMasukBaru);

router.post(
  "/existing",
  authenticate,
  authorize(["admin"]),
  addBarangMasukExisting,
);

router.get("/", authenticate, authorize(["admin", "owner"]), getBarangMasuk);
router.get(
  "/search",
  authenticate,
  authorize(["admin", "owner"]),
  searchBarangMasukByNama,
);

export default router;