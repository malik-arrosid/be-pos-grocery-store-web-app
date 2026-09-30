import pool from "../../database/db.js";

const searchBarangMasukByNama = async (req, res) => {
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
      WHERE b.nama_barang ILIKE $1
      ORDER BY bm.created_at DESC
      `,
      [`%${nama_barang.trim()}%`],
    );

    return res.status(200).json({
      success: true,
      message: "Pencarian barang masuk berdasarkan nama barang berhasil",
      data: result.rows,
    });
  } catch (err) {
    console.error("Error searchBarangMasukByNama:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export default searchBarangMasukByNama;
