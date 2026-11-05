import express from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";

import barangRoutes from "../barang/barangRoutes.js";
import barangMasukRoutes from "../barangMasuk/barangMasukRoutes.js";
import pelangganRoutes from "../pelanggan/pelangganRoutes.js";
import transaksiRoutes from "../transaksi/transaksiRoutes.js";
import historiTukarPoinRoutes from "../historiTukarPoin/historiTukarPoinRoutes.js";
import notificationRoutes from "../notification.routes.js";
import fcmRoutes from "../fcm/fcmRoutes.js";

export const createRoleRoutes = ({
  includeNotifications = false,
  includeFcm = false,
} = {}) => {
  const router = express.Router();

  router.use("/barang", authenticate, barangRoutes);
  router.use("/barang-masuk", authenticate, barangMasukRoutes);
  router.use("/pelanggan", authenticate, pelangganRoutes);
  router.use("/transaksi", authenticate, transaksiRoutes);
  router.use("/histori-tukar-poin", authenticate, historiTukarPoinRoutes);

  if (includeNotifications) {
    router.use("/notifications", notificationRoutes);
  }

  if (includeFcm) {
    router.use("/fcm-tokens", fcmRoutes);
  }

  return router;
};

const roleRoutes = createRoleRoutes();

export default roleRoutes;