import pool from "../../database/db.js";
import { normalizeUnit, buildJumlahItemLabel } from "./transaksiHelpers.js";

const searchTransaksi = async (req, res) => {
  const {
    keyword = "",
    kode_transaksi = "",
    nama_pelanggan = "",
    page = 1,
    limit = 10,
  } = req.query;

  const searchKeyword = String(
    keyword || kode_transaksi || nama_pelanggan || "",
  ).trim();

  if (!searchKeyword) {
    return res
      .status(400)
      .json({
        success: false,
        message:
          "Parameter pencarian diperlukan (keyword, kode_transaksi, atau nama_pelanggan)",
      });
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
  const offset = (pageNum - 1) * limitNum;
  const searchPattern = `%${searchKeyword}%`;

  try {
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM transaksi t
      LEFT JOIN pelanggan p ON t.id_pelanggan = p.id_pelanggan
      WHERE
        t.kode_transaksi ILIKE $1
        OR (
          t.tipe_pelanggan = 'member'
          AND p.nama_pelanggan ILIKE $1
        )
    `;
    const countResult = await pool.query(countQuery, [searchPattern]);
    const totalData = countResult.rows[0].total;
    const totalPage = Math.ceil(totalData / limitNum);

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
        WHERE
          t.kode_transaksi ILIKE $1
          OR (
            t.tipe_pelanggan = 'member'
            AND p.nama_pelanggan ILIKE $1
          )
        ORDER BY t.created_at DESC
        LIMIT $2 OFFSET $3
      `,
      [searchPattern, limitNum, offset]
    );

    const meta = {
      page: pageNum,
      limit: limitNum,
      total_data: totalData,
      total_page: totalPage,
    };

    if (transaksiResult.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Transaksi tidak ditemukan",
        data: [],
        meta,
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
      [transaksiIds]
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

    res.status(200).json({
      success: true,
      message:
        "Pencarian transaksi berdasarkan kode transaksi atau nama pelanggan member berhasil",
      data,
      meta,
    });
  } catch (err) {
    console.error("Error searchTransaksi:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export default searchTransaksi;