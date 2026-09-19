import cron from "node-cron";

import schedulerConfig from "../config/scheduler.js";
import { sendDailyReport } from "../notifications/index.js";

const startReportScheduler = () => {
  if (!schedulerConfig.enableReportScheduler) {
    console.log("Daily Report Scheduler dinonaktifkan.");
    return;
  }

  cron.schedule(
    schedulerConfig.reportCron,
    async () => {
      try {
        const notification = await sendDailyReport();

        console.log(
          `Daily Report Notification berhasil dibuat (${notification.id_notification})`,
        );
      } catch (error) {
        console.error("Daily Report Scheduler Error:", error);
      }
    },
    {
      timezone: schedulerConfig.timezone,
    },
  );

  console.log(
    `Daily Report Scheduler berjalan (${schedulerConfig.reportCron})`,
  );
};

export default startReportScheduler;