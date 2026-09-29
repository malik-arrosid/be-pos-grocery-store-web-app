import pool from "../../database/db.js";

const getMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.query;
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    const sql = `
      SELECT
        COUNT(DISTINCT t.id_transaksi) AS total_transaksi,
        COALESCE(SUM(t.total_harga), 0)::int AS total_pendapatan,
        COUNT(DISTINCT DATE(t.created_at)) AS total_hari_transaksi
      FROM transaksi t
      WHERE EXTRACT(YEAR FROM t.created_at) = $1
        AND EXTRACT(MONTH FROM t.created_at) = $2
        AND t.status_transaksi = 'berhasil'
    `;

    const { rows } = await pool.query(sql, [targetYear, targetMonth]);
    res.status(200).json({
      success: true,
      data: rows[0],
      year: parseInt(targetYear),
      month: parseInt(targetMonth),
    });
  } catch (err) {
    console.error("Error getMonthlyReport:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export default getMonthlyReport;