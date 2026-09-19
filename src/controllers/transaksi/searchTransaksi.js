import pool from "../../database/db.js";

const searchTransaksiByKodeTransaksi = async (req, res) => {
  const { kode_transaksi } = req.query;

  if (!kode_transaksi || kode_transaksi.trim() === "") {
    return res
      .status(400)
      .json({ success: false, message: "Parameter kode_transaksi diperlukan" });
  }

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
        WHERE t.kode_transaksi ILIKE $1
        ORDER BY t.created_at DESC
      `,
      [`%${kode_transaksi}%`]
    );

    res.status(200).json({
      success: true,
      message: "Pencarian transaksi berdasarkan kode transaksi berhasil",
      data: transaksiResult.rows,
    });
  } catch (err) {
    console.error("Error searchTransaksiByKodeTransaksi:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export default searchTransaksiByKodeTransaksi;