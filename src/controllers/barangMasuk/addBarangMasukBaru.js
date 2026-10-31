import pool from "../../database/db.js";
import Joi from "joi";
import { v4 as uuidv4 } from "uuid";

const addBarangMasukBaru = async (req, res) => {
  const schema = Joi.object({
    nama_barang: Joi.string().max(100).required(),
    stok_dasar: Joi.number().integer().min(1).required(),
    satuan_dasar: Joi.string().valid("PCS", "GRAM").required(),
    harga_jual_per_sd: Joi.number().precision(2).min(0).required(),
    harga_modal_per_sd: Joi.number().precision(2).min(0).required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }

  const client = await pool.connect();

  try {
    const {
      nama_barang,
      stok_dasar,
      satuan_dasar,
      harga_jual_per_sd,
      harga_modal_per_sd,
    } = value;

    const harga_beli_total = stok_dasar * harga_modal_per_sd;
    const id_barang_masuk = uuidv4();

    await client.query("BEGIN");

    const dup = await client.query(
      "SELECT nama_barang FROM barang WHERE LOWER(nama_barang) = LOWER($1)",
      [nama_barang],
    );

    if (dup.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: `Nama barang "${nama_barang}" sudah terdaftar dalam sistem. Gunakan nama barang yang berbeda.`,
        errorCode: "DUPLICATE_BARANG",
      });
    }

    const id_barang = uuidv4();

    await client.query(
      `INSERT INTO barang (
        id_barang, nama_barang, stok_dasar,
        satuan_dasar, harga_jual_per_sd, harga_modal_per_sd
      ) VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        id_barang,
        nama_barang,
        stok_dasar,
        satuan_dasar,
        harga_jual_per_sd,
        harga_modal_per_sd,
      ],
    );

    await client.query(
      `INSERT INTO barang_masuk (
        id_barang_masuk, id_barang, qty_dasar,
        harga_beli_per_sd, harga_beli_total
      ) VALUES ($1,$2,$3,$4,$5)`,
      [id_barang_masuk, id_barang, stok_dasar, harga_modal_per_sd, harga_beli_total],
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message:
        "Barang baru berhasil ditambahkan dan dicatat sebagai barang masuk",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error addBarangMasukBaru:", err.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  } finally {
    client.release();
  }
};

export default addBarangMasukBaru;