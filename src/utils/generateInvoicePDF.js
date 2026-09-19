import PDFDocument from "pdfkit";

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatDate = (d, format) => {
  if (!d) return "";
  const dt = new Date(d);

  if (format === "time") {
    const hours = String(dt.getHours()).padStart(2, "0");
    const minutes = String(dt.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  if (format === "date") {
    return dt.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return dt.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const displayQty = (qty, satuan) => {
  const s = (satuan || "").toString().toUpperCase().trim();
  const q = Number(qty || 0);

  if (s === "GRAM") {
    if (q >= 1000) {
      const kg = q / 1000;
      const kgFormatted = kg % 1 === 0 ? kg.toFixed(0) : kg.toFixed(1);
      return `${kgFormatted} kg`;
    }
    return `${q} gr`;
  }

  return `${q} pcs`;
};

// Ukuran kertas struk 80mm, tinggi dibuat cukup panjang karena PDFKit
// tidak mendukung tinggi halaman yang otomatis menyesuaikan konten.
const MM_TO_PT = 2.834645669;
const PAGE_WIDTH = 80 * MM_TO_PT;
const PAGE_HEIGHT = 250 * MM_TO_PT;
const MARGIN = 4 * MM_TO_PT;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export default async function generateInvoicePDF(meta = {}, detailBarang = []) {
  const items = Array.isArray(detailBarang) ? detailBarang : [];

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [PAGE_WIDTH, PAGE_HEIGHT],
      margin: MARGIN,
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const drawLine = () => {
      const y = doc.y;
      doc
        .moveTo(MARGIN, y)
        .lineTo(PAGE_WIDTH - MARGIN, y)
        .lineWidth(0.5)
        .stroke();
      doc.moveDown(0.3);
    };

    // Header - nama & alamat toko
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text((meta.company_name || "").toUpperCase(), { align: "center" });

    if (meta.company_address) {
      doc
        .fontSize(8)
        .font("Helvetica")
        .text(meta.company_address, { align: "center" });
    }

    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("INVOICE", { align: "center", underline: true });
    doc.moveDown(0.3);
    drawLine();

    // Info transaksi
    doc.fontSize(8).font("Helvetica");
    doc.text(`No Invoice : ${meta.kode_transaksi || "-"}`);
    doc.text(`Tanggal    : ${formatDate(meta.created_at, "date")}`);
    doc.text(`Kasir      : ${meta.kasir || "-"}`);
    doc.text(`Jam        : ${formatDate(meta.created_at, "time")}`);
    doc.text(`Pelanggan  : ${meta.nama_pelanggan || "-"}`);
    doc.text(`Status     : ${meta.tipe_pelanggan || "-"}`);

    doc.moveDown(0.3);
    drawLine();

    // Header tabel item
    const colNo = MARGIN;
    const colName = MARGIN + 15;
    const colQty = PAGE_WIDTH - MARGIN - 90;
    const colSubtotal = PAGE_WIDTH - MARGIN - 55;

    doc.fontSize(8).font("Helvetica-Bold");
    const headerY = doc.y;
    doc.text("No", colNo, headerY, { width: 15 });
    doc.text("Nama Barang", colName, headerY, { width: colQty - colName - 2 });
    doc.text("Qty", colQty, headerY, { width: 35, align: "center" });
    doc.text("Subtotal", colSubtotal, headerY, {
      width: PAGE_WIDTH - MARGIN - colSubtotal,
      align: "right",
    });
    doc.moveDown(0.4);
    drawLine();

    doc.font("Helvetica");
    if (items.length === 0) {
      doc.fontSize(8).text("Tidak ada item.", { align: "center" });
    } else {
      items.forEach((item, index) => {
        const rowY = doc.y;
        const hargaSatuan = formatCurrency(item.harga_jual_per_sd);
        const qtyText = displayQty(item.quantity, item.satuan_dasar);
        const subtotalText = formatCurrency(item.subtotal);

        doc.fontSize(8);
        doc.text(`${index + 1}.`, colNo, rowY, { width: 15 });
        doc.text(item.nama_barang || "-", colName, rowY, {
          width: colQty - colName - 2,
        });
        const afterNameY = doc.y;
        doc.text(qtyText, colQty, rowY, { width: 35, align: "center" });
        doc.text(subtotalText, colSubtotal, rowY, {
          width: PAGE_WIDTH - MARGIN - colSubtotal,
          align: "right",
        });

        doc.y = Math.max(afterNameY, doc.y);
        doc
          .fontSize(7)
          .fillColor("#555555")
          .text(`  @ ${hargaSatuan}`, colName, doc.y, {
            width: colQty - colName - 2,
          })
          .fillColor("#000000");
        doc.moveDown(0.2);
      });
    }

    doc.moveDown(0.2);
    drawLine();

    // Totals
    const totalLabelWidth = CONTENT_WIDTH - 70;
    const printTotalRow = (label, value, bold = false) => {
      const y = doc.y;
      doc.fontSize(bold ? 9 : 8).font(bold ? "Helvetica-Bold" : "Helvetica");
      doc.text(label, MARGIN, y, { width: totalLabelWidth });
      doc.text(value, MARGIN + totalLabelWidth, y, {
        width: 70,
        align: "right",
      });
      doc.moveDown(0.3);
    };

    printTotalRow("Total Harga:", formatCurrency(meta.total_harga));
    printTotalRow("Jumlah Bayar:", formatCurrency(meta.jumlah_bayar));
    printTotalRow("Kembalian:", formatCurrency(meta.kembalian), true);

    doc.moveDown(0.3);
    drawLine();

    doc
      .fontSize(8)
      .font("Helvetica-Oblique")
      .text("Terima kasih atas kunjungan Anda", { align: "center" });

    doc.end();
  });
}