const LOW_STOCK_GRAM_NAMED = {
  Beras: 1000, // 1 kg
  Dedak: 1000, // 1 kg
  Gula: 250, // 250 gram
};

export const getLowStockThreshold = (nama_barang, satuan_dasar) => {
  const satuan = String(satuan_dasar || "").toUpperCase();
  if (satuan === "PCS") return 2;
  if (satuan === "GRAM") {
    const nama = String(nama_barang || "").trim();
    return LOW_STOCK_GRAM_NAMED[nama] ?? 0;
  }
  return 0;
};

export const isLowStock = (barang) => {
  if (!barang) return false;
  const threshold = getLowStockThreshold(
    barang.nama_barang,
    barang.satuan_dasar,
  );
  return Number(barang.stok_dasar) <= threshold;
};