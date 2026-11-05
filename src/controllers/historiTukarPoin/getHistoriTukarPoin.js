import pool from "../../database/db.js";

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SELECT_FIELDS = `
  h.id_histori_tukar,
  h.id_pelanggan,
  p.nama_pelanggan,
  h.hadiah,
  h.harga_hadiah,
  h.created_at
`;

const getAllHistoriTukarPoin = async (req, res) => {
  try {
    const { page = 1, limit = 10, id_pelanggan } = req.query;
    const pageNum = parsePositiveInteger(page, 1);
    const limitNum = parsePositiveInteger(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const params = [];
    let whereClause = "";
    if (id_pelanggan) {
      if (!UUID_REGEX.test(id_pelanggan)) {
        return res.status(400).json({
          success: false,
          message: "id_pelanggan tidak valid",
        });
      }
      params.push(id_pelanggan);
      whereClause = `WHERE h.id_pelanggan = $1`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM histori_tukar_poin h ${whereClause}`,
      params,
    );
    const totalData = countResult.rows[0].total;
    const totalPage = Math.ceil(totalData / limitNum);

    const result = await pool.query(
      `SELECT ${SELECT_FIELDS}
       FROM histori_tukar_poin h
       LEFT JOIN pelanggan p ON p.id_pelanggan = h.id_pelanggan
       ${whereClause}
       ORDER BY h.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limitNum, offset],
    );

    res.status(200).json({
      success: true,
      message:
        result.rows.length === 0
          ? "Data histori tukar poin masih kosong!"
          : "Berhasil mendapatkan semua histori tukar poin",
      data: result.rows,
      meta: {
        page: pageNum,
        limit: limitNum,
        total_data: totalData,
        total_page: totalPage,
      },
    });
  } catch (err) {
    console.error("Error getAllHistoriTukarPoin:", err.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

const getHistoriTukarPoinById = async (req, res) => {
  try {
    const { id_histori_tukar } = req.params;
    if (!UUID_REGEX.test(id_histori_tukar)) {
      return res.status(400).json({
        success: false,
        message: "id_histori_tukar tidak valid",
      });
    }

    const result = await pool.query(
      `SELECT ${SELECT_FIELDS}
       FROM histori_tukar_poin h
       LEFT JOIN pelanggan p ON p.id_pelanggan = h.id_pelanggan
       WHERE h.id_histori_tukar = $1`,
      [id_histori_tukar],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Histori tukar poin tidak ditemukan!",
      });
    }

    res.status(200).json({
      success: true,
      message: "Berhasil mendapatkan histori tukar poin",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Error getHistoriTukarPoinById:", err.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export { getAllHistoriTukarPoin, getHistoriTukarPoinById };