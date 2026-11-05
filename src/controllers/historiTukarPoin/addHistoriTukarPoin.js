import pool from "../../database/db.js";
import { v4 as uuidv4 } from "uuid";
import Joi from "joi";

const addHistoriTukarPoin = async (req, res) => {
  let client;
  let transactionStarted = false;

  try {
    const schema = Joi.object({
      id_pelanggan: Joi.string().uuid().required(),
      hadiah: Joi.string().trim().max(120).required(),
      harga_hadiah: Joi.number().integer().min(1).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { id_pelanggan, hadiah, harga_hadiah } = value;

    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const pelanggan = await client.query(
      `SELECT nama_pelanggan, poin_loyalitas
       FROM pelanggan
       WHERE id_pelanggan = $1
       FOR UPDATE`,
      [id_pelanggan],
    );
    if (pelanggan.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return res.status(404).json({
        success: false,
        message: "Pelanggan tidak ditemukan!",
      });
    }

    const { nama_pelanggan, poin_loyalitas } = pelanggan.rows[0];
    if (harga_hadiah > poin_loyalitas) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return res.status(400).json({
        success: false,
        message: "Poin loyalitas pelanggan tidak mencukupi",
      });
    }

    if (poin_loyalitas < 10) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message:
          "Poin loyalitas pelanggan minimal 10 untuk melakukan penukaran",
      });
    }

    const id_histori_tukar = uuidv4();
    const result = await client.query(
      `INSERT INTO histori_tukar_poin (id_histori_tukar, id_pelanggan, hadiah, harga_hadiah)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id_histori_tukar, id_pelanggan, hadiah, harga_hadiah],
    );
    const updatedPelanggan = await client.query(
      `UPDATE pelanggan
       SET poin_loyalitas = poin_loyalitas - $1
       WHERE id_pelanggan = $2
       RETURNING poin_loyalitas`,
      [harga_hadiah, id_pelanggan],
    );
    await client.query("COMMIT");
    transactionStarted = false;

    res.status(201).json({
      success: true,
      message: "Poin loyalitas pelanggan berhasil ditukar",
      data: {
        ...result.rows[0],
        nama_pelanggan,
        poin_loyalitas: updatedPelanggan.rows[0].poin_loyalitas,
      },
    });
  } catch (err) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "Error rollback addHistoriTukarPoin:",
          rollbackError.message,
        );
      }
    }
    console.error("Error addHistoriTukarPoin:", err.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  } finally {
    client?.release();
  }
};

export default addHistoriTukarPoin;