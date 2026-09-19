// import pool from "../../database/db.js";

// const deletePelangganById = async (req, res) => {
//   const { id_pelanggan } = req.params;

//   try {
//     const existingPelanggan = await pool.query(
//       "SELECT * FROM pelanggan WHERE id_pelanggan = $1",
//       [id_pelanggan]
//     );

//     if (existingPelanggan.rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Pelanggan tidak ditemukan!",
//       });
//     }

//     const transaksiPelanggan = await pool.query(
//       "SELECT * FROM transaksi WHERE id_pelanggan = $1",
//       [id_pelanggan]
//     );

//     if (transaksiPelanggan.rows.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Pelanggan tidak dapat dihapus karena memiliki riwayat transaksi",
//       });
//     }

//     const deleteResult = await pool.query(
//       "DELETE FROM pelanggan WHERE id_pelanggan = $1 RETURNING *",
//       [id_pelanggan]
//     );

//     if (deleteResult.rowCount === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Gagal menghapus pelanggan",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Pelanggan berhasil dihapus",
//       data: deleteResult.rows[0],
//     });
//   } catch (err) {
//     console.error("Error deletePelangganById:", err.message);
//     res.status(500).json({
//       success: false,
//       message: "Server Error",
//       error: err.message,
//     });
//   }
// };

// export default deletePelangganById