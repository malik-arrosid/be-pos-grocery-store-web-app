import pool from "../../database/db.js";

const getYearlyReport = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year || new Date().getFullYear();

    const sql = `
      SELECT
        COUNT(DISTINCT t.id_transaksi) AS total_transaksi,
        COALESCE(SUM(t.total_harga), 0)::int AS total_pendapatan,
        COUNT(DISTINCT DATE(t.created_at)) AS total_hari_transaksi,
        EXTRACT(MONTH FROM t.created_at) AS bulan,
        COALESCE(SUM(t.total_harga), 0)::int AS pendapatan_bulanan
      FROM transaksi t
      WHERE EXTRACT(YEAR FROM t.created_at) = $1
        AND t.status_transaksi = 'berhasil'
      GROUP BY bulan
      ORDER BY bulan
    `;

    const summarySQL = `
      SELECT
        COUNT(DISTINCT t.id_transaksi) AS total_transaksi,
        COALESCE(SUM(t.total_harga), 0)::int AS total_pendapatan
      FROM transaksi t
      WHERE EXTRACT(YEAR FROM t.created_at) = $1
        AND t.status_transaksi = 'berhasil'
    `;

    const monthlyData = await pool.query(sql, [targetYear]);
    const summaryData = await pool.query(summarySQL, [targetYear]);

    res.status(200).json({
      success: true,
      data: {
        summary: summaryData.rows[0],
        monthly: monthlyData.rows,
      },
      year: parseInt(targetYear),
    });
  } catch (err) {
    console.error("Error getYearlyReport:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export default getYearlyReport;