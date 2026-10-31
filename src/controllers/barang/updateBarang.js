import pool from "../../database/db.js";
import Joi from "joi";
const updateBarangById = async (req, res) => {
  const id_barang = req.params.id_barang;

  const schema = Joi.object({
    nama_barang: Joi.string().max(100).optional(),
    minimum_stok: Joi.number().integer().min(0).optional(),
    harga_jual_per_sd: Joi.number().precision(2).min(0).optional(),
  }).min(1);

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }

  try {
    const oldRes = await pool.query(
      "SELECT * FROM barang WHERE id_barang = $1",
      [id_barang],
    );
    if (oldRes.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Barang tidak ditemukan!" });
    }

    if (value.nama_barang) {
      const dup = await pool.query(
        "SELECT 1 FROM barang WHERE LOWER(nama_barang) = LOWER($1) AND id_barang <> $2",
        [value.nama_barang, id_barang],
      );
      if (dup.rowCount > 0) {
        return res
          .status(400)
          .json({ success: false, message: "Nama barang sudah digunakan." });
      }
    }

    const fields = [];
    const params = [];
    let i = 1;
    const push = (col, val) => {
      fields.push(`${col} = $${i++}`);
      params.push(val);
    };

    if (value.nama_barang !== undefined) push("nama_barang", value.nama_barang);
    if (value.minimum_stok !== undefined)
      push("minimum_stok", value.minimum_stok);
    if (value.harga_jual_per_sd !== undefined)
      push("harga_jual_per_sd", value.harga_jual_per_sd);

    params.push(id_barang);

    const sql = `
      UPDATE barang
      SET ${fields.join(", ")}
      WHERE id_barang = $${i}
      RETURNING *
    `;

    const updated = await pool.query(sql, params);

    return res.status(200).json({
      success: true,
      message: "Barang berhasil diperbarui",
      data: updated.rows[0],
    });
  } catch (err) {
    console.error("Error updateBarangById:", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", error: err.message });
  }
};

export default updateBarangById;