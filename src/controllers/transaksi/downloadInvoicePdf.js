import pool from "../../database/db.js";
import generateInvoicePDF from "../../utils/generateInvoicePDF.js";

const downloadInvoicePdf = async (req, res) => {
  try {
    const { id_transaksi } = req.params;

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
      [id_transaksi],
    );

    if (transaksiResult.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Transaksi tidak ditemukan" });
    }

    const trx = transaksiResult.rows[0];

    const detailResult = await pool.query(
      `SELECT
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

    const pdfBuffer = await generateInvoicePDF(
      {
        id_transaksi: trx.id_transaksi,
        kode_transaksi: trx.kode_transaksi,
        created_at: trx.created_at,
        total_harga: trx.total_harga,
        jumlah_bayar: trx.jumlah_bayar,
        kembalian: trx.kembalian,
        kasir: trx.kasir || "Tidak diketahui",
        nama_pelanggan: trx.nama_pelanggan || "Guest",
        tipe_pelanggan: trx.tipe_pelanggan,
        status_transaksi: trx.status_transaksi,
        company_name: "Toko Kelontong Nuryati",
        company_address:
          "RT.01, RW.07, Ds.Beratwetan, Kec.Gedeg, Kab.Mojokerto",
      },
      detailResult.rows,
    );

    const idSuffix = (trx.id_transaksi || "").toString().slice(-6);
    const filename = `invoice-trx-${idSuffix}.pdf`;

    return res
      .status(200)
      .set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      })
      .send(pdfBuffer);
  } catch (err) {
    console.error("Error downloadInvoicePdf:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export default downloadInvoicePdf;
