import PDFDocument from "pdfkit";

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

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
    doc.fontSize(12).text("Detail item terjual", { underline: true });

    if (items.length === 0) {
      doc.fontSize(10).text("Tidak ada item terjual.");
    } else {
      items.forEach((item, index) => {
        if (doc.y > 760) {
          doc.addPage();
        }

        doc
          .fontSize(10)
          .text(
            `${index + 1}. ${item.item_name || "-"} | Qty: ${Number(
              item.quantity || 0,
            )} | Subtotal: ${formatCurrency(item.subtotal)} | Pelanggan: ${
              item.customer_name || "-"
            } (${item.customer_type || "-"})`,
          );
      });
    }

    doc.end();
  });
}