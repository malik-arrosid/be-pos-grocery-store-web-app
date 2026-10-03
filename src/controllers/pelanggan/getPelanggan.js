import pool from "../../database/db.js";

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const getAllPelanggan = async (req, res) => {
  try {
    // Ambil parameter pagination dari query
    const { page = 1, limit = 10, keyword = "" } = req.query;
    const pageNum = parsePositiveInteger(page, 1);
    const limitNum = parsePositiveInteger(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause untuk pencarian
    let whereClause = "WHERE 1=1";
    const params = [];

    if (keyword && keyword.trim() !== "") {
      params.push(`%${keyword}%`);
      whereClause += ` AND (nama_pelanggan ILIKE $${params.length} OR no_hp ILIKE $${params.length})`;
    }

    // Query untuk menghitung total data
    const countQuery = `
      SELECT COUNT(*)::int AS total 
      FROM pelanggan 
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const totalData = countResult.rows[0].total;
    const totalPage = Math.ceil(totalData / limitNum);

    // Query untuk mengambil data dengan pagination
    const query = `
      SELECT 
        id_pelanggan, 
        nama_pelanggan, 
        no_hp, 
        poin_loyalitas, 
        total_pembelian, 
        frekuensi_transaksi, 
        created_at, 
        updated_at 
      FROM pelanggan 
      ${whereClause} 
      ORDER BY nama_pelanggan ASC 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const queryParams = [...params, limitNum, offset];
    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Data pelanggan masih kosong!",
        data: [],
        meta: {
          page: pageNum,
          limit: limitNum,
          total_data: totalData,
          total_page: totalPage,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Berhasil mendapatkan semua pelanggan",
      data: result.rows,
      meta: {
        page: pageNum,
        limit: limitNum,
        total_data: totalData,
        total_page: totalPage,
      },
    });
  } catch (err) {
    console.error("Error getAllPelanggan:", err.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

const getPelangganById = async (req, res) => {
  try {
    const id_pelanggan = req.params.id_pelanggan;
    const result = await pool.query(
      `
      SELECT 
        id_pelanggan,
        nama_pelanggan,
        no_hp,
        poin_loyalitas,
        total_pembelian,
        frekuensi_transaksi,
        created_at,
        updated_at
      FROM pelanggan
      WHERE id_pelanggan = $1
      `,
      [id_pelanggan],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pelanggan tidak ditemukan!",
      });
    }

    res.status(200).json({
      success: true,
      message: "Berhasil mendapatkan pelanggan",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Error getPelangganById:", err.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

const searchPelanggan = async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword || keyword.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Parameter pencarian diperlukan",
        error: "KEYWORD_REQUIRED",
      });
    }

    // Untuk search, kita tetap gunakan pagination juga
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parsePositiveInteger(page, 1);
    const limitNum = parsePositiveInteger(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const searchPattern = `%${keyword.trim()}%`;

    // Count total untuk search
    const countQuery = `
      SELECT COUNT(*)::int AS total 
      FROM pelanggan 
      WHERE nama_pelanggan ILIKE $1 OR no_hp ILIKE $1
    `;
    const countResult = await pool.query(countQuery, [searchPattern]);
    const totalData = countResult.rows[0].total;
    const totalPage = Math.ceil(totalData / limitNum);

    // Query data dengan pagination
    const result = await pool.query(
      `
      SELECT 
        id_pelanggan, 
        nama_pelanggan, 
        no_hp, 
        poin_loyalitas, 
        total_pembelian, 
        frekuensi_transaksi, 
        created_at, 
        updated_at 
      FROM pelanggan 
      WHERE nama_pelanggan ILIKE $1 OR no_hp ILIKE $1
      ORDER BY nama_pelanggan ASC 
      LIMIT $2 OFFSET $3
      `,
      [searchPattern, limitNum, offset],
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Pelanggan tidak ditemukan!",
        data: [],
        meta: {
          page: pageNum,
          limit: limitNum,
          total_data: totalData,
          total_page: totalPage,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Berhasil menemukan pelanggan",
      data: result.rows,
      meta: {
        page: pageNum,
        limit: limitNum,
        total_data: totalData,
        total_page: totalPage,
      },
    });
  } catch (err) {
    console.error("Error searchPelanggan:", err.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export { getAllPelanggan, getPelangganById, searchPelanggan };