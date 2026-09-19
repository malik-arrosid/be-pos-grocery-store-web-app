import express from "express";
const router = express.Router();
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import {
  addPelanggan,
  getAllPelanggan,
  getPelangganById,
  searchPelanggan,
  updatePelangganById,
  // deletePelangganById,
} from "../../controllers/pelanggan/index.js";

router.post("/", authenticate, authorize(["kasir"]), addPelanggan);

router.get(
  "/",
  authenticate,
  authorize(["admin", "kasir", "owner"]),
  getAllPelanggan,
);

router.get(
  "/search",
  authenticate,
  authorize(["admin", "kasir", "owner"]),
  searchPelanggan,
);

router.get(
  "/:id_pelanggan",
  authenticate,
  authorize(["admin", "kasir", "owner"]),
  getPelangganById,
);

router.patch(
  "/:id_pelanggan",
  authenticate,
  authorize(["kasir", "admin"]),
  updatePelangganById,
);

// router.delete(
//   "/:id_pelanggan",
//   authenticate,
//   authorize(["admin"]),
//   deletePelangganById,
// );

export default router;
