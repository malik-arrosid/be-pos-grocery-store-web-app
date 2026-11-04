import pool from "../../database/db.js";

const getBarangSalesByPrice = async (req, res) => {
  try {
    const { startDate, endDate, id_barang, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    const offset = (pageNum - 1) * limitNum;

    const params = [];
    let whereClause = "WHERE t.status_transaksi = 'berhasil'";

    if (startDate && endDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Use YYYY-MM-DD",
        });
      }
      if (new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({
          success: false,
          message: "Start date must be before or equal to end date",
        });
      }
      params.push(startDate);
      whereClause += ` AND DATE(t.created_at) >= $${params.length}`;
      params.push(endDate);
      whereClause += ` AND DATE(t.created_at) <= $${params.length}`;
    }

    if (id_barang) {
      params.push(id_barang);
      whereClause += ` AND dt.id_barang = $${params.length}`;
    }

    const fromClause = `
      FROM detail_transaksi dt
      JOIN transaksi t ON t.id_transaksi = dt.id_transaksi
      LEFT JOIN barang b ON b.id_barang = dt.id_barang
      ${whereClause}
    `;

    const countQuery = `
      SELECT COUNT(*)::int AS total FROM (
        SELECT dt.id_barang, dt.harga_jual_per_sd
        ${fromClause}
        GROUP BY dt.id_barang, dt.harga_jual_per_sd
      ) sub
    `;
    const countResult = await pool.query(countQuery, params);
    const totalData = countResult.rows[0].total;
    const totalPage = Math.ceil(totalData / limitNum);

    const dataQuery = `
      SELECT
        dt.id_barang,
        dt.nama_barang,
        b.satuan_dasar,
        dt.harga_jual_per_sd,
        SUM(dt.quantity)::int AS total_quantity,
        COUNT(DISTINCT dt.id_transaksi)::int AS total_transaksi,
        SUM(dt.subtotal)::int AS total_subtotal
      ${fromClause}
      GROUP BY dt.id_barang, dt.nama_barang, b.satuan_dasar, b.created_at, dt.harga_jual_per_sd
      ORDER BY b.created_at DESC, dt.harga_jual_per_sd ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const dataParams = [...params, limitNum, offset];

    const result = await pool.query(dataQuery, dataParams);

    return res.status(200).json({
      success: true,
      message: "Berhasil mendapatkan histori penjualan per harga jual",
      data: result.rows,
      meta: {
        page: pageNum,
        limit: limitNum,
        total_data: totalData,
        total_page: totalPage,
      },
    });
  } catch (err) {
    console.error("Error getBarangSalesByPrice:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export default getBarangSalesByPrice;