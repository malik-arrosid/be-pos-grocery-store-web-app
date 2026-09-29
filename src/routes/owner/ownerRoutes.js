import express from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import {
  getWeeklyReport,
  getMonthlyReport,
  getYearlyReport,
} from "../../controllers/reports/index.js";
import { getDateRangeStats } from "../../controllers/transaksi/index.js";

const router = express.Router();

// Reports routes - owner only

router.get(
  "/reports/weekly",
  authenticate,
  authorize(["owner"]),
  getWeeklyReport,
);

router.get(
  "/reports/monthly",
  authenticate,
  authorize(["owner"]),
  getMonthlyReport,
);

router.get(
  "/reports/yearly",
  authenticate,
  authorize(["owner"]),
  getYearlyReport,
);

router.get(
  "/transaksi/stats/date-range",
  authenticate,
  authorize(["owner"]),
  getDateRangeStats
);

export default router;