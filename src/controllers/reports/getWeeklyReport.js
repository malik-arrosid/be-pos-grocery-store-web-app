import pool from "../../database/db.js";

const getWeeklyReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let sql;
    let params = [];

    if (startDate && endDate) {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Use YYYY-MM-DD",
        });
      }

      // Validate date range
      if (new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({
          success: false,
          message: "Start date must be before or equal to end date",
        });
      }

      sql = `
        WITH hari AS (
            SELECT generate_series::date AS tanggal
            FROM generate_series($1::date, $2::date, interval '1 day')
        )
        SELECT
            to_char(h.tanggal, 'YYYY-MM-DD') AS date_iso,
            COUNT(DISTINCT t.id_transaksi)::int AS total_transaksi_harian,
            COALESCE(SUM(t.total_harga), 0)::int AS total_harian
        FROM hari h
        LEFT JOIN transaksi t
            ON date(t.created_at) = h.tanggal
            AND t.status_transaksi = 'berhasil'
        GROUP BY h.tanggal
        ORDER BY h.tanggal;
      `;
      params = [startDate, endDate];
    } else {
      // Default: last 7 days
      sql = `
        WITH hari AS (
            SELECT generate_series::date AS tanggal
            FROM generate_series(current_date - interval '6 day', current_date, interval '1 day')
        )
        SELECT
            to_char(h.tanggal, 'YYYY-MM-DD') AS date_iso,
            COUNT(DISTINCT t.id_transaksi)::int AS total_transaksi_harian,
            COALESCE(SUM(t.total_harga), 0)::int AS total_harian
        FROM hari h
        LEFT JOIN transaksi t
            ON date(t.created_at) = h.tanggal
            AND t.status_transaksi = 'berhasil'
        GROUP BY h.tanggal
        ORDER BY h.tanggal;
      `;
    }

    const { rows } = await pool.query(sql, params);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("Error getWeeklyReport:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export default getWeeklyReport;