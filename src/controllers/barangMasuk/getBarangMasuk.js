import pool from "../../database/db.js";

const getBarangMasuk = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      keyword = "",
      from_date,
      to_date,
    } = req.query;

    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = "WHERE 1=1";

    if (keyword && keyword.trim() !== "") {
      params.push(`%${keyword}%`);
      whereClause += ` AND b.nama_barang ILIKE $${params.length}`;
    }

    if (from_date) {
      params.push(from_date);
      whereClause += ` AND bm.created_at >= $${params.length}`;
    }

    if (to_date) {
      params.push(to_date);
      whereClause += ` AND bm.created_at <= $${params.length}`;
    }

    const query = `
      SELECT
        bm.id_barang_masuk,
        bm.id_barang,
        b.nama_barang,
        b.satuan_dasar,
        bm.qty_dasar,
        bm.harga_beli_per_sd,
        bm.harga_beli_total,
        bm.created_at
      FROM barang_masuk bm
      JOIN barang b ON bm.id_barang = b.id_barang
      ${whereClause}
      ORDER BY bm.created_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `;

    params.push(limit);
    params.push(offset);

    const result = await pool.query(query, params);

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM barang_masuk bm
      JOIN barang b ON bm.id_barang = b.id_barang
      ${whereClause}
    `;

    const countResult = await pool.query(
      countQuery,
      params.slice(0, params.length - 2)
    );

    return res.status(200).json({
      success: true,
      message: "Berhasil mendapatkan data barang masuk",
      meta: {
        page: Number(page),
        limit: Number(limit),
        total_data: countResult.rows[0].total,
        total_page: Math.ceil(countResult.rows[0].total / limit),
      },
      data: result.rows,
    });
  } catch (err) {
    console.error("Error getBarangMasuk:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export default getBarangMasuk;