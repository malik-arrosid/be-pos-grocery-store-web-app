import PDFDocument from "pdfkit-table";
import { formatQty } from "./qtyFormat.js";

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatReportQty = (value, unit) => {
  const satuan = String(unit ?? "")
    .trim()
    .toUpperCase();
  const numericValue = Number(value);

  if ((satuan === "GRAM" || satuan === "G") && Number.isFinite(numericValue)) {
    if (numericValue >= 1000) {
      const kgValue = numericValue / 1000;
      const formattedKg = Number.isInteger(kgValue)
        ? String(kgValue)
        : kgValue.toLocaleString("id-ID", {
            maximumFractionDigits: 3,
          });
      return `${formattedKg} kg`;
    }

    const formattedGram = Number.isInteger(numericValue)
      ? String(numericValue)
      : numericValue.toLocaleString("id-ID", {
          maximumFractionDigits: 3,
        });
    return `${formattedGram} gr`;
  }

  return formatQty(value, unit);
};

export default function generateDailyReportNotificationPDF(reportData = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const summary = reportData.summary || {};
    const topTx = reportData.highest_transaction;
    const items = Array.isArray(reportData.daily_items) ? reportData.daily_items : [];

    doc.fontSize(16).text("Laporan Harian Notifikasi", { align: "center" });
    doc.moveDown(0.4);
    doc.fontSize(11).text(`Tanggal laporan: ${reportData.report_date || "-"}`);
    doc.text(`Total penjualan: ${formatCurrency(summary.total_sales)}`);
    doc.text(`Total transaksi: ${Number(summary.total_transactions || 0)} transaksi`);
    doc.moveDown(0.6);

    doc.fontSize(12).text("Transaksi nominal tertinggi", { underline: true });
    if (topTx) {
      doc.fontSize(10).text(`Kode transaksi: ${topTx.kode_transaksi || "-"}`);
      doc.text(`Nominal: ${formatCurrency(topTx.total_harga)}`);
      doc.text(
        `Pelanggan: ${topTx.customer_name || "-"} (${topTx.customer_type || "-"})`,
      );
    } else {
      doc.fontSize(10).text("Tidak ada transaksi berhasil pada tanggal laporan.");
    }

    doc.moveDown(0.8);
    doc.fontSize(12).text("Detail barang terjual", { underline: true });
    doc.moveDown(0.4);

    const finalize = async () => {
      if (items.length === 0) {
        doc.fontSize(10).text("Tidak ada barang terjual.");
        doc.end();
        return;
      }

      const rows = items.map((item, index) => ({
        no: index + 1,
        nama_barang: item.item_name || "-",
        qty: formatReportQty(item.quantity, item.satuan_dasar),
        subtotal: formatCurrency(item.subtotal),
        pelanggan: item.customer_name
          ? `${item.customer_name} (${item.customer_type || "-"})`
          : "-",
      }));

      const table = {
        headers: [
          { label: "No.", property: "no", width: 32, align: "center" },
          { label: "Nama barang", property: "nama_barang", width: 130 },
          { label: "Qty", property: "qty", width: 40, align: "right" },
          { label: "Subtotal", property: "subtotal", width: 100, align: "right" },
          { label: "Pelanggan", property: "pelanggan", width: 130, align: "right" },
        ],
        datas: rows,
      };

      await doc.table(table, {
        x: 40,
        y: doc.y,
        divider: {
          header: { disabled: false, width: 1, opacity: 0.6 },
          horizontal: { disabled: false, width: 0.5, opacity: 0.3 },
        },
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
        prepareRow: () => doc.font("Helvetica").fontSize(9),
      });

      doc.end();
    };

    finalize().catch(reject);
  });
}