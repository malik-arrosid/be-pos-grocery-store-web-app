import pool from "../../database/db.js";

const getBarangSalesByPrice = async (req, res) => {
  try {
    const { id_barang, keyword="", page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    const offset = (pageNum - 1) * limitNum;

    const params = [];
    let whereClause = "WHERE t.status_transaksi = 'berhasil'";

    if (id_barang) {
      params.push(id_barang);
      whereClause += ` AND dt.id_barang = $${params.length}`;
    }

    const trimmedKeyword = String(keyword || "").trim();
    if (trimmedKeyword) {
      params.push(`%${trimmedKeyword}%`);
      whereClause += ` AND dt.nama_barang ILIKE $${params.length}`;
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
      ) grouped_sales
    `;
    const countResult = await pool.query(countQuery, params);
    const totalData = countResult.rows[0].total;
    const totalPage = Math.ceil(totalData / limitNum);

    const dataQuery = `
      SELECT
        grouped_sales.id_barang,
        grouped_sales.nama_barang_terbaru AS nama_barang,
        grouped_sales.satuan_dasar,
        grouped_sales.harga_jual_per_sd,
        grouped_sales.total_quantity,
        grouped_sales.total_transaksi,
        grouped_sales.total_subtotal,
        grouped_sales.tgl_terakhir_transaksi
      FROM (
        SELECT
          dt.id_barang,
          dt.harga_jual_per_sd,
          (
            SELECT dt2.nama_barang
            FROM detail_transaksi dt2
            JOIN transaksi t2 ON t2.id_transaksi = dt2.id_transaksi
            WHERE dt2.id_barang = dt.id_barang
              AND t2.status_transaksi = 'berhasil'
            ORDER BY t2.created_at DESC
            LIMIT 1
          ) AS nama_barang_terbaru,
          MAX(b.satuan_dasar) AS satuan_dasar,
          MAX(b.created_at) AS barang_created_at,
          SUM(dt.quantity)::int AS total_quantity,
          COUNT(DISTINCT dt.id_transaksi)::int AS total_transaksi,
          SUM(dt.subtotal)::int AS total_subtotal,
          MAX(t.created_at) AS tgl_terakhir_transaksi
        ${fromClause}
        GROUP BY dt.id_barang, dt.harga_jual_per_sd
      ) grouped_sales
      ORDER BY grouped_sales.barang_created_at DESC, grouped_sales.harga_jual_per_sd ASC
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
        keyword: trimmedKeyword || null,
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