import express from "express";
const router = express.Router();
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import {
  addTransaksi,
  getAllTransaksi,
  getTransaksiById,
  searchTransaksiByKodeTransaksi,
  updateTransaksiById,
  // deleteTransaksiById,
  getDateRangeStats,
  downloadInvoicePdf,
} from "../../controllers/transaksi/index.js";

router.post("/", authenticate, authorize(["kasir"]), addTransaksi);

router.get(
  "/",
  authenticate,
  authorize(["kasir", "owner"]),
  getAllTransaksi,
);

router.get(
  "/:id_transaksi",
  authenticate,
  authorize(["kasir", "owner"]),
  getTransaksiById,
);

router.get(
  "/search",
  authenticate,
  authorize(["kasir", "owner"]),
  searchTransaksiByKodeTransaksi,
);

router.get(
  "/stats/date-range",
  authenticate,
  authorize(["owner"]),
  getDateRangeStats,
);

router.get(
  "/:id_transaksi/invoice/download",
  authenticate,
  authorize(["admin", "kasir", "owner"]),
  downloadInvoicePdf,
);

router.patch(
  "/:id_transaksi",
  authenticate,
  authorize(["kasir", "admin"]),
  updateTransaksiById,
);

// router.delete(
//   "/:id_transaksi",
//   authenticate,
//   authorize(["admin"]),
//   deleteTransaksiById,
// );

export default router;