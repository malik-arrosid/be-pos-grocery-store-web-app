import pool from "../../database/db.js";

const getOwnerDashboardStats = async (req, res) => {
  try {
    const todayTxQuery = `
      SELECT
        COUNT(*)::int AS total_transaksi_hari_ini,
        COALESCE(SUM(t.total_harga), 0)::bigint AS omset_hari_ini
      FROM transaksi t
      WHERE DATE(t.created_at) = CURRENT_DATE
        AND t.status_transaksi = 'berhasil'
    `;

    // ===== 2. Keuntungan barang HARI INI =====
    // Keuntungan = SUM(subtotal) - SUM(harga_modal_per_sd * quantity)
    // Catatan: harga_modal_per_sd diambil dari barang saat ini (bukan snapshot historis)
    const profitQuery = `
      SELECT
        COALESCE(SUM(dt.subtotal), 0)::bigint AS total_penjualan_item,
        COALESCE(SUM(dt.quantity * b.harga_modal_per_sd), 0)::bigint AS total_hpp,
        COUNT(DISTINCT dt.id_barang)::int AS jumlah_barang_terjual_hari_ini
      FROM detail_transaksi dt
      JOIN transaksi t ON t.id_transaksi = dt.id_transaksi
      LEFT JOIN barang b ON b.id_barang = dt.id_barang
      WHERE DATE(t.created_at) = CURRENT_DATE
        AND t.status_transaksi = 'berhasil'
    `;

    // ===== 3. Total pembelian barang masuk HARI INI =====
    const barangMasukQuery = `
      SELECT
        COALESCE(SUM(bm.harga_beli_total), 0)::bigint AS total_pembelian_barang_hari_ini,
        COUNT(*)::int AS jumlah_barang_masuk_hari_ini
      FROM barang_masuk bm
      WHERE DATE(bm.created_at) = CURRENT_DATE
    `;

    const topProfitQuery = `
      SELECT
        dt.id_barang,
        COALESCE(MAX(b.nama_barang), MAX(dt.nama_barang)) AS nama_barang,
        MAX(b.satuan_dasar) AS satuan_dasar,
        COALESCE(SUM(dt.quantity), 0)::int AS total_quantity,
        COALESCE(SUM(dt.subtotal), 0)::bigint AS total_subtotal,
        COALESCE(SUM(dt.quantity * b.harga_modal_per_sd), 0)::bigint AS total_hpp,
        COALESCE(SUM(dt.subtotal - (dt.quantity * b.harga_modal_per_sd)), 0)::bigint AS total_laba,
        COUNT(DISTINCT dt.id_transaksi)::int AS total_transaksi
      FROM detail_transaksi dt
      JOIN transaksi t ON t.id_transaksi = dt.id_transaksi
      LEFT JOIN barang b ON b.id_barang = dt.id_barang
      WHERE DATE(t.created_at) = CURRENT_DATE
        AND t.status_transaksi = 'berhasil'
      GROUP BY dt.id_barang
      ORDER BY total_laba DESC
      LIMIT 5
    `;
    
    const topSpendQuery = `
      SELECT
        dt.id_barang,
        COALESCE(MAX(b.nama_barang), MAX(dt.nama_barang)) AS nama_barang,
        MAX(b.satuan_dasar) AS satuan_dasar,
        COALESCE(SUM(dt.quantity), 0)::int AS total_quantity,
        COALESCE(SUM(dt.subtotal), 0)::bigint AS total_subtotal,
        COALESCE(SUM(dt.subtotal - (dt.quantity * b.harga_modal_per_sd)), 0)::bigint AS total_laba,
        COUNT(DISTINCT dt.id_transaksi)::int AS total_transaksi
      FROM detail_transaksi dt
      JOIN transaksi t ON t.id_transaksi = dt.id_transaksi
      LEFT JOIN barang b ON b.id_barang = dt.id_barang
      WHERE DATE(t.created_at) = CURRENT_DATE
        AND t.status_transaksi = 'berhasil'
      GROUP BY dt.id_barang
      ORDER BY total_subtotal DESC, total_quantity DESC
      LIMIT 5
    `;
    
    const topFrequentQuery = `
      SELECT
        dt.id_barang,
        COALESCE(MAX(b.nama_barang), MAX(dt.nama_barang)) AS nama_barang,
        MAX(b.satuan_dasar) AS satuan_dasar,
        COALESCE(SUM(dt.quantity), 0)::int AS total_quantity,
        COALESCE(SUM(dt.subtotal), 0)::bigint AS total_subtotal,
        COALESCE(SUM(dt.subtotal - (dt.quantity * b.harga_modal_per_sd)), 0)::bigint AS total_laba,
        COUNT(DISTINCT dt.id_transaksi)::int AS total_transaksi
      FROM detail_transaksi dt
      JOIN transaksi t ON t.id_transaksi = dt.id_transaksi
      LEFT JOIN barang b ON b.id_barang = dt.id_barang
      WHERE DATE(t.created_at) = CURRENT_DATE
        AND t.status_transaksi = 'berhasil'
      GROUP BY dt.id_barang
      ORDER BY total_transaksi DESC, total_quantity DESC
      LIMIT 5
    `;
    
    const [
      txResult,
      profitResult,
      masukResult,
      topProfitResult,
      topSpendResult,
      topFrequentResult,
    ] = await Promise.all([
      pool.query(todayTxQuery),
      pool.query(profitQuery),
      pool.query(barangMasukQuery),
      pool.query(topProfitQuery),
      pool.query(topSpendQuery),
      pool.query(topFrequentQuery),
    ]);

    const totalTransaksiHariIni =
      txResult.rows[0]?.total_transaksi_hari_ini || 0;
    const omsetHariIni = Number(txResult.rows[0]?.omset_hari_ini || 0);

    const totalPenjualanItem = Number(
      profitResult.rows[0]?.total_penjualan_item || 0,
    );
    const totalHpp = Number(profitResult.rows[0]?.total_hpp || 0);
    const keuntunganBersihHariIni = totalPenjualanItem - totalHpp;
    const jumlahBarangTerjualHariIni =
      profitResult.rows[0]?.jumlah_barang_terjual_hari_ini || 0;

    const totalPembelianBarangHariIni = Number(
      masukResult.rows[0]?.total_pembelian_barang_hari_ini || 0,
    );
    const jumlahBarangMasukHariIni =
      masukResult.rows[0]?.jumlah_barang_masuk_hari_ini || 0;

    const untungRugiOmset = omsetHariIni - totalPembelianBarangHariIni;
    const statusUntungRugiOmset = untungRugiOmset >= 0 ? "untung" : "rugi";

    const mapTopRow = (row) => ({
      id_barang: row.id_barang,
      nama_barang: row.nama_barang,
      satuan_dasar: row.satuan_dasar || "PCS",
      total_quantity: Number(row.total_quantity || 0),
      total_subtotal: Number(row.total_subtotal || 0),
      total_hpp: Number(row.total_hpp || 0),
      total_laba: Number(row.total_laba || 0),
      total_transaksi: Number(row.total_transaksi || 0),
    });
      
    return res.status(200).json({
      success: true,
      message: "Berhasil mendapatkan statistik dashboard owner hari ini",
      data: {
        total_transaksi_hari_ini: totalTransaksiHariIni,
        omset_hari_ini: omsetHariIni,
        total_pembelian_barang_hari_ini: totalPembelianBarangHariIni,
        jumlah_barang_masuk_hari_ini: jumlahBarangMasukHariIni,
        keuntungan_bersih_hari_ini: keuntunganBersihHariIni,
        jumlah_barang_terjual_hari_ini: jumlahBarangTerjualHariIni,
        untung_rugi_omset: untungRugiOmset,
        status_untung_rugi_omset: statusUntungRugiOmset,
        top_barang_laba: topProfitResult.rows.map(mapTopRow),
        top_barang_belanja: topSpendResult.rows.map(mapTopRow),
        top_barang_sering: topFrequentResult.rows.map(mapTopRow),
      },
    });
  } catch (err) {
    console.error("Error getOwnerDashboardStats:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export default getOwnerDashboardStats;