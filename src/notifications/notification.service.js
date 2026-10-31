import { NOTIFICATION_TYPES } from "./notification.types.js";
import { formatNotification } from "./notification.formatter.js";
import {
  createNotification,
  getDailyReportMetadataByDate,
} from "./notification.repository.js";
import { publishNotification } from "../realtime/index.js";
import { sendOwnerPush } from "../fcm/index.js";

const formatIDRCurrency = (value) =>
  Number(value || 0).toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const deliverNotification = async (notification) => {
  await publishNotification(notification);
  sendOwnerPush(notification).catch((error) =>
    console.error("Error sending FCM push notification:", error),
  );

  return notification;
};

export const sendTransactionCreated = async ({
  payload = {},
  referenceTable = null,
  referenceId = null,
  actorUserId = null,
  metadata = null,
}) => {
  const formattedNotification = formatNotification(
    NOTIFICATION_TYPES.TRANSACTION_CREATED,
    payload,
  );

  const notification = await createNotification({
    title: formattedNotification.title,
    message: formattedNotification.message,
    notificationType: NOTIFICATION_TYPES.TRANSACTION_CREATED,
    referenceTable,
    referenceId,
    actorUserId,
    metadata,
  });

  return deliverNotification(notification);
};

export const sendDailyReport = async (reportDate) => {
  const targetDate = reportDate || new Date().toISOString().split("T")[0];
  const metadata = await getDailyReportMetadataByDate(targetDate);

  const message = `Laporan harian ${targetDate}: total penjualan ${formatIDRCurrency(
    metadata.summary.total_sales,
  )} dari ${metadata.summary.total_transactions} transaksi.`;

  const formattedNotification = formatNotification(
    NOTIFICATION_TYPES.REPORT_DAILY,
    { message },
  );

  const notification = await createNotification({
    title: formattedNotification.title,
    message: formattedNotification.message,
    notificationType: NOTIFICATION_TYPES.REPORT_DAILY,
    referenceTable: null,
    referenceId: null,
    metadata,
  });

  return deliverNotification(notification);
};

export const sendLowStockNotificationForItem = async ({
  barang,
  actorUserId = null,
  source = "system",
}) => {
  if (!barang) return null;

  const stok = Number(barang.stok_dasar || 0);
  const minimum = Number(barang.minimum_stok || 0);

  // Guard: pastikan memang masih di bawah/ sama dengan minimum
  if (stok > minimum) return null;

  const isOutOfStock = stok === 0;
  const message = isOutOfStock
    ? `Stok barang "${barang.nama_barang}" sudah habis (0 ${barang.satuan_dasar}). Segera lakukan restok di barang masuk.`
    : `Stok barang "${barang.nama_barang}" menipis: ${stok} ${barang.satuan_dasar} (minimum ${minimum} ${barang.satuan_dasar}). Segera lakukan restok di barang masuk.`;

  const formattedNotification = formatNotification(
    NOTIFICATION_TYPES.LOW_STOCK,
    { message },
  );

  const metadata = {
    id_barang: barang.id_barang,
    nama_barang: barang.nama_barang,
    stok_dasar: stok,
    satuan_dasar: barang.satuan_dasar,
    minimum_stok: minimum,
    is_out_of_stock: isOutOfStock,
    source,
  };

  const notification = await createNotification({
    title: formattedNotification.title,
    message: formattedNotification.message,
    notificationType: NOTIFICATION_TYPES.LOW_STOCK,
    referenceTable: "barang",
    referenceId: barang.id_barang,
    actorUserId,
    metadata,
  });

  return deliverNotification(notification);
};