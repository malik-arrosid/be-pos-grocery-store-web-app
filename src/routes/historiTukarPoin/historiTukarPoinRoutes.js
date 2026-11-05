import express from "express";
const router = express.Router();
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import {
  addHistoriTukarPoin,
  getAllHistoriTukarPoin,
  getHistoriTukarPoinById,
} from "../../controllers/historiTukarPoin/index.js";

router.post("/", authenticate, authorize(["owner"]), addHistoriTukarPoin);

router.get("/", authenticate, authorize(["owner"]), getAllHistoriTukarPoin);

router.get(
  "/:id_histori_tukar",
  authenticate,
  authorize(["owner"]),
  getHistoriTukarPoinById,
);

export default router;