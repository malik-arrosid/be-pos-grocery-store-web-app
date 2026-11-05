import pool from "../../database/db.js";

const getOwnerDashboardStats = async (req, res) => {
  try {
    // ===== 1. Statistik transaksi HARI INI =====
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
        COALESCE(SUM(dt.quantity * b.harga_modal_per_sd), 0)::bigint AS total_hpp
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

    const [txResult, profitResult, masukResult] = await Promise.all([
      pool.query(todayTxQuery),
      pool.query(profitQuery),
      pool.query(barangMasukQuery),
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