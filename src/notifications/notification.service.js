import { NOTIFICATION_TYPES } from "./notification.types.js";
import { formatNotification } from "./notification.formatter.js";
import {
  createNotification,
  getDailyReportMetadataByDate,
  getLowStockItems,
  getBarangByIds,
  hasRecentNotificationForItem,
} from "./notification.repository.js";
import { publishNotification } from "../realtime/index.js";
import { sendOwnerPush } from "../fcm/index.js";
import { formatQty } from "../utils/qtyFormat.js";
import {
  getLowStockThreshold,
  isLowStock,
  isOutOfStock,
} from "../utils/lowStockConfig.js";

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

const createLowStockForItem = async (item, actorUserId, dedupMinutes) => {
  const already = await hasRecentNotificationForItem(
    item.id_barang,
    NOTIFICATION_TYPES.LOW_STOCK,
    dedupMinutes,
  );
  if (already) return null;

  const threshold = getLowStockThreshold(item.nama_barang, item.satuan_dasar);
  const metadata = {
    nama_barang: item.nama_barang,
    stok_dasar: Number(item.stok_dasar),
    satuan_dasar: item.satuan_dasar,
    threshold,
  };
  const formatted = formatNotification(NOTIFICATION_TYPES.LOW_STOCK, metadata);
  const notification = await createNotification({
    title: formatted.title,
    message: formatted.message,
    notificationType: NOTIFICATION_TYPES.LOW_STOCK,
    referenceTable: "barang",
    referenceId: item.id_barang,
    actorUserId,
    metadata,
  });
  return deliverNotification(notification);
};

const createOutOfStockForItem = async (item, actorUserId, dedupMinutes) => {
  const already = await hasRecentNotificationForItem(
    item.id_barang,
    NOTIFICATION_TYPES.OUT_OF_STOCK,
    dedupMinutes,
  );
  if (already) return null;

  const metadata = {
    nama_barang: item.nama_barang,
    stok_dasar: Number(item.stok_dasar),
    satuan_dasar: item.satuan_dasar,
  };
  const formatted = formatNotification(
    NOTIFICATION_TYPES.OUT_OF_STOCK,
    metadata,
  );
  const notification = await createNotification({
    title: formatted.title,
    message: formatted.message,
    notificationType: NOTIFICATION_TYPES.OUT_OF_STOCK,
    referenceTable: "barang",
    referenceId: item.id_barang,
    actorUserId,
    metadata,
  });
  return deliverNotification(notification);
};

export const sendOutOfStockNotification = async ({
  barangIds = null,
  actorUserId = null,
  dedupMinutes = 60,
} = {}) => {
  const items =
    barangIds && barangIds.length > 0
      ? await getBarangByIds(barangIds)
      : await getLowStockItems();

  const created = [];
  for (const item of items) {
    if (!isOutOfStock(item)) continue;
    const notif = await createOutOfStockForItem(
      item,
      actorUserId,
      dedupMinutes,
    );
    if (notif) created.push(notif);
  }
  return created;
};

export const sendStockNotifications = async ({
  barangIds = null,
  actorUserId = null,
  dedupMinutes,
} = {}) => {
  const items =
    barangIds && barangIds.length > 0
      ? await getBarangByIds(barangIds)
      : await getLowStockItems();

  const created = [];
  for (const item of items) {
    let notif = null;
    if (isOutOfStock(item)) {
      notif = await createOutOfStockForItem(item, actorUserId, dedupMinutes);
    } else if (isLowStock(item)) {
      notif = await createLowStockForItem(item, actorUserId, dedupMinutes);
    }
    if (notif) created.push(notif);
  }
  return created;
};