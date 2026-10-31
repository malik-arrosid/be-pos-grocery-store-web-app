import pool from "../database/db.js";

export const createNotification = async ({
  title,
  message,
  notificationType,
  referenceTable = null,
  referenceId = null,
  actorUserId = null,
  metadata = null,
}) => {
  const query = `
    INSERT INTO notifications
    (
      title,
      message,
      notification_type,
      reference_table,
      reference_id,
      actor_user_id,
      metadata
    )
    VALUES
    (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7
    )
    RETURNING *
  `;

  const values = [
    title,
    message,
    notificationType,
    referenceTable,
    referenceId,
    actorUserId,
    metadata,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
};

export const getUnreadNotifications = async () => {
  const query = `
    SELECT *
    FROM notifications
    WHERE is_read = FALSE
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query);

  return result.rows;
};

export const getAllNotifications = async ({ limit, offset }) => {
  const query = `
    SELECT *
    FROM notifications
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `;

  const result = await pool.query(query, [limit, offset]);

  return result.rows;
};

export const getNotificationById = async (id_notification) => {
  const query = `
    SELECT *
    FROM notifications
    WHERE id_notification = $1
  `;

  const result = await pool.query(query, [id_notification]);

  return result.rows[0] || null;
};

export const getDailyReportMetadataByDate = async (reportDate) => {
  const summaryQuery = `
    SELECT
      COALESCE(SUM(t.total_harga), 0)::int AS total_sales,
      COUNT(*)::int AS total_transactions,
      COUNT(*) FILTER (WHERE t.tipe_pelanggan = 'member')::int AS total_member_transactions,
      COUNT(*) FILTER (WHERE t.tipe_pelanggan = 'guest')::int AS total_guest_transactions
    FROM transaksi t
    WHERE DATE(t.created_at) = $1
      AND t.status_transaksi = 'berhasil'
  `;

  const highestTransactionQuery = `
    SELECT
      t.id_transaksi,
      t.kode_transaksi,
      t.total_harga::int AS total_harga,
      t.tipe_pelanggan AS customer_type,
      CASE
        WHEN t.tipe_pelanggan = 'member' THEN COALESCE(p.nama_pelanggan, 'Member')
        ELSE COALESCE(t.nama_guest, 'Guest')
      END AS customer_name
    FROM transaksi t
    LEFT JOIN pelanggan p ON p.id_pelanggan = t.id_pelanggan
    WHERE DATE(t.created_at) = $1
      AND t.status_transaksi = 'berhasil'
    ORDER BY t.total_harga DESC, t.created_at ASC
    LIMIT 1
  `;

  const itemsQuery = `
    SELECT
      dt.id_detail_transaksi,
      dt.id_transaksi,
      t.kode_transaksi,
      dt.nama_barang AS item_name,
      dt.quantity::int AS quantity,
      b.satuan_dasar AS satuan_dasar,
      dt.subtotal::int AS subtotal,
      t.tipe_pelanggan AS customer_type,
      CASE
        WHEN t.tipe_pelanggan = 'member' THEN COALESCE(p.nama_pelanggan, 'Member')
        ELSE COALESCE(t.nama_guest, 'Guest')
      END AS customer_name
    FROM detail_transaksi dt
    JOIN transaksi t ON t.id_transaksi = dt.id_transaksi
    LEFT JOIN barang b ON b.id_barang = dt.id_barang
    LEFT JOIN pelanggan p ON p.id_pelanggan = t.id_pelanggan
    WHERE DATE(t.created_at) = $1
      AND t.status_transaksi = 'berhasil'
    ORDER BY t.created_at ASC, dt.nama_barang ASC
  `;

  const [summaryResult, highestResult, itemsResult] = await Promise.all([
    pool.query(summaryQuery, [reportDate]),
    pool.query(highestTransactionQuery, [reportDate]),
    pool.query(itemsQuery, [reportDate]),
  ]);

  return {
    report_date: reportDate,
    generated_at: new Date().toISOString(),
    summary: summaryResult.rows[0],
    highest_transaction: highestResult.rows[0] || null,
    daily_items: itemsResult.rows,
  };
};

export const getNotificationsCount = async () => {
  const query = `
    SELECT COUNT(*)::int AS total
    FROM notifications
  `;

  const result = await pool.query(query);

  return result.rows[0].total;
};

export const getUnreadNotificationsCount = async () => {
  const query = `
    SELECT COUNT(*)::int AS total
    FROM notifications
    WHERE is_read = FALSE
  `;

  const result = await pool.query(query);

  return result.rows[0].total;
};

export const markAsRead = async (id_notification) => {
  const query = `
    UPDATE notifications
    SET is_read = TRUE
    WHERE id_notification = $1
    RETURNING *
  `;

  const result = await pool.query(query, [id_notification]);

  return result.rows[0];
};

export const markAllAsRead = async () => {
  const query = `
    UPDATE notifications
    SET is_read = TRUE
    WHERE is_read = FALSE
  `;

  await pool.query(query);

  return true;
};

export const getLowStockItems = async () => {
  const query = `
    SELECT
      id_barang,
      nama_barang,
      stok_dasar,
      satuan_dasar,
      minimum_stok,
      harga_jual_per_sd,
      harga_modal_per_sd
    FROM barang
    WHERE stok_dasar <= minimum_stok
    ORDER BY stok_dasar ASC, nama_barang ASC
  `;
  const result = await pool.query(query);
  return result.rows;
};

export const hasRecentLowStockNotificationForItem = async (
  id_barang,
  withinMinutes = 60,
) => {
  const query = `
    SELECT 1
    FROM notifications
    WHERE notification_type = 'LOW_STOCK'
      AND reference_table = 'barang'
      AND reference_id = $1
      AND created_at >= NOW() - ($2 || ' minutes')::interval
    LIMIT 1
  `;
  const result = await pool.query(query, [id_barang, String(withinMinutes)]);
  return result.rowCount > 0;
};