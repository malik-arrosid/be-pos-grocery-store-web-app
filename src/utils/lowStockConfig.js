const LOW_STOCK_GRAM_PREFIXES = {
  Beras: 1000,
  Dedak: 1000,
  Gula: 250,
};

const PCS_DEFAULT_THRESHOLD = 2;

const findGramThreshold = (nama_barang) => {
  const nama = String(nama_barang || "")
    .trim()
    .toLowerCase();
  if (!nama) return 0;

  for (const [prefix, threshold] of Object.entries(LOW_STOCK_GRAM_PREFIXES)) {
    const normalizedPrefix = prefix.toLowerCase();
    if (nama.startsWith(normalizedPrefix)) {
      return threshold;
    }
  }
  return 0;
};

export const getLowStockThreshold = (nama_barang, satuan_dasar) => {
  const satuan = String(satuan_dasar || "").toUpperCase();
  if (satuan === "PCS") return PCS_DEFAULT_THRESHOLD;
  if (satuan === "GRAM") return findGramThreshold(nama_barang);
  return 0;
};

export const isOutOfStock = (barang) => {
  if (!barang) return false;
  return Number(barang.stok_dasar) === 0;
};

export const isLowStock = (barang) => {
  if (!barang) return false;
  if (isOutOfStock(barang)) return false;
  const threshold = getLowStockThreshold(
    barang.nama_barang,
    barang.satuan_dasar,
  );
  if (threshold <= 0) return false;
  return Number(barang.stok_dasar) <= threshold;
};