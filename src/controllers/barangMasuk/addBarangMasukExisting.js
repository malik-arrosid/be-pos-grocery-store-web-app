import pool from "../../database/db.js";
import Joi from "joi";
import { v4 as uuidv4 } from "uuid";

const addBarangMasukExisting = async (req, res) => {
  const schema = Joi.object({
    id_barang: Joi.string().uuid().required(),
    qty_dasar: Joi.number().integer().min(1).required(),
    harga_beli_per_sd: Joi.number().precision(2).min(0).required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }

  const client = await pool.connect();

  try {
    const { id_barang, qty_dasar, harga_beli_per_sd } = value;
    const harga_beli_total = qty_dasar * harga_beli_per_sd;
    const id_barang_masuk = uuidv4();

    await client.query("BEGIN");

    const barangRes = await client.query(
      "SELECT nama_barang, harga_modal_per_sd FROM barang WHERE id_barang = $1",
      [id_barang]
    );

    if (barangRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ success: false, message: "Barang tidak ditemukan" });
    }

    const hargaModalLama = Number(barangRes.rows[0].harga_modal_per_sd);
    const namaBarang = barangRes.rows[0].nama_barang;
    const hargaBerubah = hargaModalLama !== Number(harga_beli_per_sd);

    await client.query(
      `INSERT INTO barang_masuk (
        id_barang_masuk, id_barang, qty_dasar,
        harga_beli_per_sd, harga_beli_total
      ) VALUES ($1,$2,$3,$4,$5)`,
      [id_barang_masuk, id_barang, qty_dasar, harga_beli_per_sd, harga_beli_total]
    );

    if (hargaBerubah) {
      await client.query(
        `UPDATE barang
         SET stok_dasar = stok_dasar + $1,
             harga_modal_per_sd = $2
         WHERE id_barang = $3`,
        [qty_dasar, harga_beli_per_sd, id_barang]
      );
    } else {
      await client.query(
        `UPDATE barang
         SET stok_dasar = stok_dasar + $1
         WHERE id_barang = $2`,
        [qty_dasar, id_barang]
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Barang masuk berhasil dicatat",
      harga_modal_diperbarui: hargaBerubah,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error addBarangMasukExisting:", err.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  } finally {
    client.release();
  }
};

export default addBarangMasukExisting;