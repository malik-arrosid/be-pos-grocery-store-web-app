import pool from "../../database/db.js";

const normalizeUnit = (u) => {
  if (!u && u !== 0) return "PCS";
  const s = String(u).trim().toLowerCase();
  if (["g", "gr", "gram", "grams"].includes(s)) return "GRAM";
  if (s.includes("gr")) return "GRAM";
  return "PCS";
};

const getTransaksiById = async (req, res) => {
  const { id_transaksi } = req.params;

  try {
    const transaksiResult = await pool.query(
      `
      SELECT 
        t.id_transaksi,
        t.kode_transaksi,
        t.tipe_pelanggan,
        t.id_pelanggan,
        COALESCE(p.nama_pelanggan, t.nama_guest) AS nama_pelanggan,
        u.username AS kasir,
        t.total_harga,
        t.jumlah_bayar,
        t.kembalian,
        t.status_transaksi,
        t.created_at
      FROM transaksi t
      LEFT JOIN pelanggan p ON t.id_pelanggan = p.id_pelanggan
      LEFT JOIN users u ON t.id_user = u.id_user
      WHERE t.id_transaksi = $1
    `,
      [id_transaksi]
    );

    if (transaksiResult.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Transaksi tidak ditemukan" });
    }

    const trx = transaksiResult.rows[0];

    const detailResult = await pool.query(
      `SELECT
         dt.id_detail_transaksi,
         dt.id_barang,
         dt.nama_barang,
         dt.harga_jual_per_sd,
         dt.quantity,
         dt.subtotal,
         b.satuan_dasar
       FROM detail_transaksi dt
       LEFT JOIN barang b ON dt.id_barang = b.id_barang
       WHERE dt.id_transaksi = $1 
       ORDER BY dt.id_detail_transaksi ASC`,
      [id_transaksi],
    );

    const detail_barang = (detailResult.rows || []).map((d) => ({
      ...d,
      satuan_dasar: normalizeUnit(d.satuan_dasar),
    }));
    
    res.status(200).json({
      success: true,
      message: "Transaksi ditemukan",
      data: {
        ...trx,
        detail_barang,
      },
    });
  } catch (err) {
    console.error("Error getTransaksiById:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export default getTransaksiById;  