import { NOTIFICATION_TYPES } from "./notification.types.js";
import { formatNotificationCurrency } from "./notification.utils.js";
import { formatQty } from "../utils/qtyFormat.js";

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
      const satuan = payload.satuan_dasar || "";
      const stokFormatted = formatQty(payload.stok_dasar, satuan);
      const thresholdFormatted = formatQty(payload.threshold, satuan);

      return {
        title: "Peringatan Stok Menipis",
        message:
          payload.message ||
          `Segera Restok Barang "${payload.nama_barang || "-"}" karna tersisa hanya ${stokFormatted ?? "-"} (batas low stock: ${thresholdFormatted ?? "-"})`,
      };

    case NOTIFICATION_TYPES.OUT_OF_STOCK: {
      const satuanLabel =
        String(payload.satuan_dasar || "")
          .trim()
          .toUpperCase() === "GRAM"
          ? "gram"
          : "pcs";
      return {
        title: "Peringatan Stok Habis",
        message:
          payload.message ||
          `Segera Restok Barang "${payload.nama_barang || "-"}" karna stok sudah habis (stok: 0 ${satuanLabel})`,
      };
    }

    default:
      return {
        title: "Notifikasi",
        message: payload.message || "Terdapat aktivitas baru pada sistem.",
      };
  }
};