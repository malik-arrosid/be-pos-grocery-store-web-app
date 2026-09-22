import pool from "../../database/db.js";
import { v4 as uuidv4 } from "uuid";
import { sendTransactionCreated } from "../../notifications/index.js";

const addTransaksi = async (req, res) => {
  let client;

  try {
    const {
      tipe_pelanggan,
      id_pelanggan,
      id_user: idUserFromBody,
      items,
      jumlah_bayar,
    } = req.body;

    const id_user = idUserFromBody || req.user?.id_user;

    if (
      !tipe_pelanggan ||
      !id_user ||
      !Array.isArray(items) ||
      items.length === 0 ||
      typeof jumlah_bayar === "undefined"
    ) {
      return res.status(400).json({ message: "Input tidak lengkap." });
    }

    const bayarNominal = Number(jumlah_bayar || 0);
    let total_harga = 0;
    const detailTransaksi = [];
    const barangIds = [...new Set(items.map((item) => item.id_barang))];

    // Fungsi pembulatan untuk satuan GRAM (kelipatan 500)
    const roundKasirGramSubtotal = (value) => {
      const num = Math.round(Number(value) || 0);
      if (num <= 0) return 0;
      const base = 500;
      if (num % base === 0) return num;
      return Math.ceil(num / base) * base;
    };

    client = await pool.connect();
    await client.query("BEGIN");
    const rollbackAndRespond = async (status, message) => {
      await client.query("ROLLBACK");
      client.release();
      client = null;
      return res.status(status).json({ message });
    };

    const barangResult = await client.query(
      `SELECT *
       FROM barang
       WHERE id_barang = ANY($1::uuid[])
       FOR UPDATE`,
      [barangIds],
    );
    const barangById = new Map(
      barangResult.rows.map((barang) => [barang.id_barang, barang]),
    );
    const quantitiesByBarangId = new Map();

    // Proses setiap item barang
    for (const item of items) {
      const b = barangById.get(item.id_barang);
      if (!b) {
        return rollbackAndRespond(
          404,
          `Barang ID ${item.id_barang} tidak ditemukan.`,
        );
      }

      const qty = Number(item.quantity || 0);
      // Normalisasi satuan
      const satuan = (b.satuan_dasar || b.satuan || "")
        .toString()
        .toUpperCase();

      if (!qty || qty <= 0) {
        return rollbackAndRespond(
          400,
          `Quantity barang '${b.nama_barang}' tidak valid.`,
        );
      }

      if (satuan !== "GRAM" && !Number.isInteger(qty)) {
        return rollbackAndRespond(
          400,
          `Quantity barang '${b.nama_barang}' harus bilangan bulat untuk satuan PCS.`,
        );
      }

      const totalQuantity =
        (quantitiesByBarangId.get(b.id_barang) || 0) + qty;
      if (Number(b.stok_dasar) < totalQuantity) {
        return rollbackAndRespond(
          400,
          `Stok barang '${b.nama_barang}' tidak cukup.`,
        );
      }
      quantitiesByBarangId.set(b.id_barang, totalQuantity);

      // Hitung subtotal
      const subtotalFromClient =
        typeof item.subtotal !== "undefined" ? Number(item.subtotal) : null;
      const rawSubtotal = Number(b.harga_jual_per_sd || 0) * qty;
      const computedSubtotal =
        satuan === "GRAM" ? roundKasirGramSubtotal(rawSubtotal) : rawSubtotal;
      const finalSubtotal =
        subtotalFromClient !== null && !Number.isNaN(subtotalFromClient)
          ? subtotalFromClient
          : computedSubtotal;

      total_harga += Number(finalSubtotal || 0);

      // Simpan detail transaksi dengan format yang sesuai untuk generateInvoicePDF
      detailTransaksi.push({
        id_barang: b.id_barang,
        nama_barang: b.nama_barang,
        harga_jual_per_sd: Number(b.harga_jual_per_sd || 0),
        quantity: qty,
        satuan_dasar: b.satuan_dasar || b.satuan || null, // Pastikan satuan_dasar ada
        subtotal: Number(finalSubtotal || 0),
      });
    }

    // Validasi pembayaran
    if (bayarNominal < total_harga) {
      return rollbackAndRespond(400, "Jumlah bayar kurang dari total harga.");
    }

    const kembalian = bayarNominal - total_harga;
    const id_transaksi = uuidv4();
    const id_suffix = id_transaksi.slice(-6).toUpperCase();
    const kode_transaksi = `TRX-${id_suffix}`;
    const status_transaksi = "berhasil";

    // Insert transaksi utama
    await client.query(
      `INSERT INTO transaksi (
        id_transaksi, kode_transaksi, id_pelanggan, tipe_pelanggan, 
        nama_guest, id_user, total_harga, jumlah_bayar, kembalian, status_transaksi
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        id_transaksi,
        kode_transaksi,
        tipe_pelanggan === "guest" ? null : id_pelanggan,
        tipe_pelanggan,
        tipe_pelanggan === "guest" ? `guest-${id_suffix}` : null,
        id_user,
        total_harga,
        bayarNominal,
        kembalian,
        status_transaksi,
      ],
    );

    const detailValues = [];
    const detailPlaceholders = detailTransaksi.map((detail, index) => {
      const parameterStart = index * 7;
      detailValues.push(
        uuidv4(),
        id_transaksi,
        detail.id_barang,
        detail.nama_barang,
        detail.harga_jual_per_sd,
        detail.quantity,
        detail.subtotal,
      );
      return `($${parameterStart + 1}, $${parameterStart + 2}, $${
        parameterStart + 3
      }, $${parameterStart + 4}, $${parameterStart + 5}, $${
        parameterStart + 6
      }, $${parameterStart + 7})`;
    });

    await client.query(
      `INSERT INTO detail_transaksi (
        id_detail_transaksi, id_transaksi, id_barang,
        nama_barang, harga_jual_per_sd, quantity, subtotal
      ) VALUES ${detailPlaceholders.join(", ")}`,
      detailValues,
    );

    const stockValues = [];
    const stockPlaceholders = [...quantitiesByBarangId].map(
      ([idBarang, quantity], index) => {
        const parameterStart = index * 2;
        stockValues.push(idBarang, quantity);
        // Explicitly cast quantity to numeric: without it, an all-parameter
        // VALUES column can be inferred as text by Postgres, which then
        // fails the "integer - text" subtraction below.
        return `($${parameterStart + 1}::uuid, $${parameterStart + 2}::numeric)`;
      },
    );

    await client.query(
      `UPDATE barang AS b
       SET stok_dasar = b.stok_dasar - stock_updates.quantity
       FROM (VALUES ${stockPlaceholders.join(", ")}) AS stock_updates(
         id_barang,
         quantity
       )
       WHERE b.id_barang = stock_updates.id_barang`,
      stockValues,
    );

    // Update poin member jika pelanggan member
    let nama_pelanggan_final = `guest-${id_suffix}`;
    if (tipe_pelanggan === "member" && id_pelanggan) {
      const poinBaru = Math.floor(total_harga / 10000);
      const pelangganResult = await client.query(
        `UPDATE pelanggan SET 
          poin_loyalitas = poin_loyalitas + $1,
          total_pembelian = total_pembelian + $2,
          frekuensi_transaksi = frekuensi_transaksi + 1
        WHERE id_pelanggan = $3
        RETURNING nama_pelanggan`,
        [poinBaru, total_harga, id_pelanggan],
      );
      nama_pelanggan_final =
        pelangganResult.rows[0]?.nama_pelanggan || "Guest";
    }

    // Ambil data kasir
    const kasirResult = await client.query(
      "SELECT username FROM users WHERE id_user = $1",
      [id_user],
    );
    const nama_kasir = kasirResult.rows[0]?.username || "Tidak diketahui";

    await client.query("COMMIT");
    client.release();
    client = null;

    // Invoice PDF kini dibuat on-demand saat diunduh (lihat downloadInvoicePdf),
    // tidak lagi digenerate & disimpan ke disk saat transaksi dibuat.
    let notificationError = null;

    try {
      const actorRoleLabel = req.user?.role === "admin" ? "Admin" : "Kasir";
      await sendTransactionCreated({
        payload: {
          actorRole: actorRoleLabel,
          actorUsername: req.user?.username || nama_kasir,
          kodeTransaksi: kode_transaksi,
          totalHarga: total_harga,
          namaPelanggan: nama_pelanggan_final,
        },
        referenceTable: "transaksi",
        referenceId: id_transaksi,
        actorUserId: id_user,
        metadata: {
          id_transaksi,
          kode_transaksi,
          total_harga,
          tipe_pelanggan,
        },
      });
    } catch (err) {
      console.error("Error creating transaction notification:", err);
      notificationError = err?.message || String(err);
    }

    // Response sukses
    return res.status(201).json({
      success: true,
      message: "Transaksi berhasil dibuat.",
      data: {
        id_transaksi,
        kode_transaksi,
        total_harga,
        jumlah_bayar: bayarNominal,
        kembalian,
        nama_pelanggan: nama_pelanggan_final,
        tipe_pelanggan,
        status_transaksi,
        ...(notificationError ? { notification_error: notificationError } : {}),
      },
    });
  } catch (err) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackErr) {
        console.error("Error rolling back addTransaksi:", rollbackErr.message);
      } finally {
        client.release();
      }
    }
    console.error("Error addTransaksi:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

export default addTransaksi;