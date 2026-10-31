import pool from "../../database/db.js";
import config from "../../config/config.js";

const getAllBarang = async (req, res) => {
  try {
    const { page = 1, limit, keyword = "" } = req.query;

    const isPaginated = limit !== undefined;
    const limitNum = isPaginated ? Number(limit) : null;
    const offset = isPaginated ? (Number(page) - 1) * limitNum : 0;
    const params = [];
    let whereClause = "WHERE 1=1";

    if (keyword && keyword.trim() !== "") {
      params.push(`%${keyword}%`);
      whereClause += ` AND nama_barang ILIKE $${params.length}`;
    }

    let query = `
      SELECT
        id_barang,
        nama_barang,
        stok_dasar,
        satuan_dasar,
        minimum_stok,
        harga_jual_per_sd,
        harga_modal_per_sd,
        created_at,
        updated_at
      FROM barang
      ${whereClause}
      ORDER BY created_at DESC
    `;
    
    if (isPaginated) {
      query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limitNum);
      params.push(offset);
    }

    const result = await pool.query(query, params);

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM barang
      ${whereClause}
    `;

    const countParams = isPaginated
      ? params.slice(0, params.length - 2)
      : params;

    const countResult = await pool.query(countQuery, countParams);
    const total_data = countResult.rows[0].total;

    return res.status(200).json({
      success: true,
      message: "Berhasil mendapatkan semua barang",
      ...(isPaginated && {
        meta: {
          page: Number(page),
          limit: limitNum,
          total_data,
          total_page: Math.ceil(total_data / limitNum),
        },
      }),
      data: result.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

const getBarangById = async (req, res) => {
  try {
    const id_barang = req.params.id_barang;
    const barang = await pool.query(
      `
      SELECT
        id_barang,
        nama_barang,
        stok_dasar,
        satuan_dasar,
        minimum_stok,
        harga_jual_per_sd,
        harga_modal_per_sd,
        created_at,
        updated_at
      FROM barang
      WHERE id_barang = $1
      `,
      [id_barang],
    );

    if (barang.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Barang tidak ditemukan!",
      });
    }

    res.status(200).json({
      success: true,
      message: "Barang ditemukan",
      data: barang.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

const searchBarangByName = async (req, res) => {
  try {
    const { nama_barang } = req.query;

    if (!nama_barang || nama_barang.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Parameter nama_barang diperlukan",
      });
    }

    const result = await pool.query(
      `
      SELECT
        id_barang,
        nama_barang,
        stok_dasar,
        satuan_dasar,
        minimum_stok,
        harga_jual_per_sd,
        harga_modal_per_sd,
        created_at,
        updated_at
      FROM barang
      WHERE nama_barang ILIKE $1
      ORDER BY nama_barang ASC
      `,
      [`%${nama_barang}%`],
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Barang tidak ditemukan!",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Barang ditemukan",
      data: result.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export { getAllBarang, getBarangById, searchBarangByName };