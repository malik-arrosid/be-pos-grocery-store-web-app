// import pool from "../../database/db.js";
// import fs from "fs";
// import path from "path";

// const deleteTransaksiById = async (req, res) => {
//   const { id_transaksi } = req.params;

//   try {
//     const cekTrx = await pool.query(
//       `SELECT id_transaksi FROM transaksi WHERE id_transaksi = $1`,
//       [id_transaksi]
//     );

//     if (cekTrx.rowCount === 0) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Transaksi tidak ditemukan." });
//     }

//     const suffix = id_transaksi.slice(-6).toUpperCase();
//     const filename = `invoice-trx-${suffix}.pdf`;

//     const filepath = path.join(
//       "src",
//       "file-generate",
//       "invoices",
//       filename
//     );

//     const detail = await pool.query(
//       `SELECT id_barang, quantity FROM detail_transaksi WHERE id_transaksi = $1`,
//       [id_transaksi]
//     );

//     for (const item of detail.rows) {
//       await pool.query(
//         `UPDATE barang SET stok_dasar = stok_dasar + $1 WHERE id_barang = $2`,
//         [item.quantity, item.id_barang]
//       );
//     }

//     await pool.query(`DELETE FROM detail_transaksi WHERE id_transaksi = $1`, [
//       id_transaksi,
//     ]);
//     await pool.query(`DELETE FROM transaksi WHERE id_transaksi = $1`, [
//       id_transaksi,
//     ]);

//     if (fs.existsSync(filepath)) {
//       fs.unlinkSync(filepath);
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Transaksi dan file invoice berhasil dihapus (dev/testing).",
//     });
//   } catch (err) {
//     console.error("Error deleteTransaksiById:", err.message);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// export default deleteTransaksiById;