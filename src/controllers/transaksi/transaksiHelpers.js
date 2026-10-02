const normalizeUnit = (u) => {
  const s = String(u || "")
    .trim()
    .toLowerCase();
  if (s === "gram" || s === "gr" || s === "g") return "gram";
  return "pcs";
};

const buildJumlahItemLabel = (detailRows = []) => {
  if (!Array.isArray(detailRows)) return "0";

  const totals = { pcs: 0, gram: 0 };
  const order = [];

  for (const row of detailRows) {
    const satuan = normalizeUnit(row?.satuan_dasar);
    const qty = Number(row?.quantity || 0);
    if (!Number.isFinite(qty) || qty <= 0) continue;

    if (!order.includes(satuan)) order.push(satuan);
    totals[satuan] += qty;
  }

  const parts = [];
  for (const unit of order) {
    if (unit === "gram") {
      if (totals.gram >= 1000) {
        const kg = totals.gram / 1000;
        parts.push(`${kg} kg`);
      } else {
        parts.push(`${totals.gram} gr`);
      }
    }
    if (unit === "pcs") parts.push(`${totals.pcs} pcs`);
  }

  return parts.length ? parts.join(" + ") : "0";
};

export { normalizeUnit, buildJumlahItemLabel };
