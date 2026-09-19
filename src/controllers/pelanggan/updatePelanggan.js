import pool from "../../database/db.js";
import Joi from "joi";

const updatePelangganById = async (req, res) => {
  const { id_pelanggan } = req.params;
  const { nama_pelanggan, no_hp } = req.body;

  if (!nama_pelanggan && !no_hp) {
    return res.status(400).json({
      success: false,
      message: "Minimal satu field harus diisi (nama_pelanggan atau no_hp)",
    });
  }

  try {
    const schema = Joi.object({
      nama_pelanggan: Joi.string().max(100),
      no_hp: Joi.string().max(15).allow(null, ""),
    });

    const { error } = schema.validate({ nama_pelanggan, no_hp });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const existingPelanggan = await pool.query(
      "SELECT * FROM pelanggan WHERE id_pelanggan = $1",
      [id_pelanggan]
    );

    if (existingPelanggan.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pelanggan tidak ditemukan!",
      });
    }

    if (nama_pelanggan) {
      const existingNama = await pool.query(
        "SELECT 1 FROM pelanggan WHERE nama_pelanggan = $1 AND id_pelanggan != $2",
        [nama_pelanggan, id_pelanggan]
      );

      if (existingNama.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Nama pelanggan sudah digunakan oleh pelanggan lain",
        });
      }
    }

    if (no_hp !== undefined && no_hp && no_hp.trim() !== "") {
      const existingNoHp = await pool.query(
        "SELECT 1 FROM pelanggan WHERE no_hp = $1 AND id_pelanggan != $2",
        [no_hp, id_pelanggan]
      );

      if (existingNoHp.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Nomor HP sudah digunakan oleh pelanggan lain",
        });
      }
    }

    const updateFields = [];
    const values = [];

    if (nama_pelanggan) {
      updateFields.push(`nama_pelanggan = $${updateFields.length + 1}`);
      values.push(nama_pelanggan);
    }

    if (no_hp !== undefined) {
      updateFields.push(`no_hp = $${updateFields.length + 1}`);
      values.push(no_hp);
    }

    values.push(id_pelanggan);

    const updatedPelanggan = await pool.query(
      `UPDATE pelanggan 
       SET ${updateFields.join(", ")} 
       WHERE id_pelanggan = $${values.length} 
       RETURNING *`,
      values
    );

    res.status(200).json({
      success: true,
      message: "Pelanggan berhasil diperbarui",
      data: updatedPelanggan.rows[0],
    });
  } catch (err) {
    console.error("Error updatePelanggan:", err.message);

    if (err.code === "23505") {
      const detail = err.detail.toLowerCase();
      let message = "Data sudah digunakan oleh pelanggan lain";

      if (detail.includes("nama_pelanggan")) {
        message = "Nama pelanggan sudah digunakan";
      } else if (detail.includes("no_hp")) {
        message = "Nomor HP sudah digunakan";
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

export default updatePelangganById;