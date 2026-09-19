import { getDailyReportMetadataByDate } from "../../notifications/notification.repository.js";

const getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split("T")[0];
    const reportData = await getDailyReportMetadataByDate(targetDate);
    res.status(200).json({
      success: true,
      data: reportData,
      date: targetDate,
    });
  } catch (err) {
    console.error("Error getDailyReport:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export default getDailyReport;