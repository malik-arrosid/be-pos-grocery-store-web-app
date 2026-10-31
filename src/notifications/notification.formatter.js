import { NOTIFICATION_TYPES } from "./notification.types.js";
import { formatNotificationCurrency } from "./notification.utils.js";

export const formatNotification = (type, payload = {}) => {
  const actorRole = payload.actorRole || "Pengguna";
  const actorUsername = payload.actorUsername || "unknown";

  switch (type) {
    case NOTIFICATION_TYPES.REPORT_DAILY:
      return {
        title: "Laporan Harian Toko",
        message:
          payload.message ||
          "Laporan toko hari ini telah tersedia dan siap untuk ditinjau.",
      };

    case NOTIFICATION_TYPES.TRANSACTION_CREATED:
      return {
        title: "Transaksi Baru Dibuat",
        message: `${actorRole} ${actorUsername} membuat transaksi ${payload.kodeTransaksi || "-"} sebesar ${formatNotificationCurrency(payload.totalHarga)} atas nama "${payload.namaPelanggan || "-"}".`,
      };

    case NOTIFICATION_TYPES.LOW_STOCK:
      return {
        title: "Peringatan Stok Menipis",
        message: payload.message,
      };

    default:
      return {
        title: "Notifikasi",
        message: payload.message || "Terdapat aktivitas baru pada sistem.",
      };
  }
};