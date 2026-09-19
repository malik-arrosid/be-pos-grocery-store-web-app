import pool from "../../database/db.js";
import { v4 as uuidv4 } from "uuid";
import Joi from "joi";

const addPelanggan = async (req, res) => {
  try {
    const schema = Joi.object({
      nama_pelanggan: Joi.string().max(100).required(),
      no_hp: Joi.string()
        .pattern(/^\d*$/)
        .max(15)
        .allow(null, "")
        .custom((value) => {
          if (value === "") return null;
          return value;
        }),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { nama_pelanggan, no_hp } = value;

    const existingNama = await pool.query(
      "SELECT 1 FROM pelanggan WHERE nama_pelanggan = $1",
      [nama_pelanggan],
    );

    if (existingNama.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Nama pelanggan sudah terdaftar",
      });
    }

    if (no_hp && no_hp.trim() !== "") {
      const existingNoHp = await pool.query(
        "SELECT 1 FROM pelanggan WHERE no_hp = $1",
        [no_hp],
      );

      if (existingNoHp.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Nomor HP sudah terdaftar",
        });
      }
    }

    const id_pelanggan = uuidv4();
    const normalizedNoHp = no_hp?.trim() || null;
    const result = await pool.query(
      `INSERT INTO pelanggan (
        id_pelanggan,
        nama_pelanggan,
        no_hp,
        poin_loyalitas,
        total_pembelian,
        frekuensi_transaksi
      ) VALUES ($1, $2, $3, 0, 0, 0)
      RETURNING *`,
      [id_pelanggan, nama_pelanggan, normalizedNoHp],
    );

    res.status(201).json({
      success: true,
      message: "Pelanggan berhasil ditambahkan",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Error addPelanggan:", err.message);

    if (err.code === "23505") {
      const detail = err.detail.toLowerCase();
      let message = "Data sudah terdaftar";

      if (detail.includes("nama_pelanggan")) {
        message = "Nama pelanggan sudah terdaftar";
      } else if (detail.includes("no_hp")) {
        message = "Nomor HP sudah terdaftar";
      }

      return res.status(400).json({
        success: false,
        message: message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export default addPelanggan;