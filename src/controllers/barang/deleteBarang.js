// import pool from "../../database/db.js";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import { dirname } from "path";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const deleteBarangById = async (req, res) => {
//   try {
//     const id_barang = req.params.id_barang;

//     const findBarang = await pool.query(
//       "SELECT image_barang FROM barang WHERE id_barang = $1",
//       [id_barang]
//     );

//     if (findBarang.rows.length === 0) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Barang tidak ditemukan!" });
//     }

//     const imagePath = findBarang.rows[0].image_barang;

//     const deleteResult = await pool.query(
//       "DELETE FROM barang WHERE id_barang = $1",
//       [id_barang]
//     );

//     if (deleteResult.rowCount === 0) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Barang tidak ada di database!" });
//     }

//     if (imagePath) {
//       const fullPath = path.join(__dirname, "../../", imagePath);
//       fs.unlink(fullPath, (err) => {
//         if (err) {
//           console.error("Gagal menghapus file gambar:", err.message);
//         } else {
//           console.log("Gambar berhasil dihapus:", imagePath);
//         }
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Barang dan gambar berhasil dihapus!",
//     });
//   } catch (err) {
//     console.error("Error deleteBarangById:", err.message);
//     res
//       .status(500)
//       .json({ success: false, message: "Server Error", error: err.message });
//   }
// };

// export default deleteBarangById;