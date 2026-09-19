import express from "express";
const router = express.Router();
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import {
  // addBarang,
  getAllBarang,
  getBarangById,
  searchBarangByName,
  updateBarangById,
  // deleteBarangById,
} from "../../controllers/barang/index.js";

// router.post("/", authenticate, authorize(["admin"]), addBarang);

router.get(
  "/",
  authenticate,
  authorize(["admin", "kasir", "owner"]),
  getAllBarang,
);

router.get(
  "/search",
  authenticate,
  authorize(["admin", "kasir", "owner"]),
  searchBarangByName,
);

router.get(
  "/:id_barang",
  authenticate,
  authorize(["admin", "kasir", "owner"]),
  getBarangById,
);


router.patch(
  "/:id_barang",
  authenticate,
  authorize(["admin"]),
  updateBarangById,
);

// router.delete(
//   "/:id_barang",
//   authenticate,
//   authorize(["admin"]),
//   deleteBarangById,
// );

export default router;