import pool from "../../database/db.js";
import { normalizeUnit, buildJumlahItemLabel } from "./transaksiHelpers.js";

const getAllTransaksi = async (req, res) => {
  try {
    // Ambil parameter pagination dari query
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Query untuk menghitung total data
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM transaksi t
    `;
    const countResult = await pool.query(countQuery);
    const totalData = countResult.rows[0].total;
    const totalPage = Math.ceil(totalData / limitNum);

    // Query untuk mengambil data dengan pagination
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
      ORDER BY t.created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [limitNum, offset],
    );

    if (transaksiResult.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Data transaksi kosong",
        data: [],
        meta: {
          page: pageNum,
          limit: limitNum,
          total_data: totalData,
          total_page: totalPage,
        },
      });
    }

    const transaksiIds = transaksiResult.rows.map((trx) => trx.id_transaksi);
    const detailResult = await pool.query(
      `
      SELECT
        dt.id_transaksi,
        dt.id_detail_transaksi,
        dt.id_barang,
        dt.nama_barang,
        dt.harga_jual_per_sd,
        dt.quantity,
        dt.subtotal,
        b.satuan_dasar
      FROM detail_transaksi dt
      LEFT JOIN barang b ON dt.id_barang = b.id_barang
      WHERE dt.id_transaksi = ANY($1::uuid[])
      ORDER BY dt.id_transaksi ASC, dt.id_detail_transaksi ASC
      `,
      [transaksiIds],
    );

    const detailsByTransaksiId = new Map();
    for (const detail of detailResult.rows) {
      const detailBarang = {
        ...detail,
        satuan_dasar: normalizeUnit(detail.satuan_dasar),
      };
      delete detailBarang.id_transaksi;

      const details = detailsByTransaksiId.get(detail.id_transaksi) || [];
      details.push(detailBarang);
      detailsByTransaksiId.set(detail.id_transaksi, details);
    }

    const data = transaksiResult.rows.map((trx) => {
      const detail_barang = detailsByTransaksiId.get(trx.id_transaksi) || [];

      return {
        ...trx,
        jumlah_item: buildJumlahItemLabel(detail_barang),
        detail_barang,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Berhasil mendapatkan semua transaksi",
      data,
      meta: {
        page: pageNum,
        limit: limitNum,
        total_data: totalData,
        total_page: totalPage,
      },
    });
  } catch (err) {
    console.error("Error getAllTransaksi:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export default getAllTransaksi;