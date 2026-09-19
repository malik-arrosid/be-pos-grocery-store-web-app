import pool from "../../database/db.js";

const updateTransaksiById = async (req, res) => {
  const { id_transaksi } = req.params;
  const { jumlah_bayar, status_transaksi } = req.body;

  if (!jumlah_bayar && !status_transaksi) {
    return res.status(400).json({
      success: false,
      message:
        "Minimal satu field (jumlah_bayar atau status_transaksi) harus diisi.",
    });
  }

  try {
    const trx = await pool.query(
      `SELECT * FROM transaksi WHERE id_transaksi = $1`,
      [id_transaksi]
    );
    if (trx.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Transaksi tidak ditemukan." });
    }

    const dataLama = trx.rows[0];
    let finalJumlahBayar = dataLama.jumlah_bayar;
    let finalStatus = dataLama.status_transaksi;

    if (jumlah_bayar) {
      if (jumlah_bayar < dataLama.total_harga) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Jumlah bayar tidak boleh kurang dari total harga.",
          });
      }
      finalJumlahBayar = jumlah_bayar;
    }

    if (status_transaksi) {
      finalStatus = status_transaksi;
    }

    const kembalianBaru = finalJumlahBayar - dataLama.total_harga;

    await pool.query(
      `
      UPDATE transaksi
      SET jumlah_bayar = $1,
          kembalian = $2,
          status_transaksi = $3
      WHERE id_transaksi = $4
    `,
      [finalJumlahBayar, kembalianBaru, finalStatus, id_transaksi]
    );

    return res.status(200).json({
      success: true,
      message: "Transaksi berhasil diperbarui.",
      data: {
        id_transaksi,
        total_harga: dataLama.total_harga,
        jumlah_bayar: finalJumlahBayar,
        kembalian: kembalianBaru,
        status_transaksi: finalStatus,
      },
    });
  } catch (err) {
    console.error("Error updateTransaksiById:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export default updateTransaksiById;
