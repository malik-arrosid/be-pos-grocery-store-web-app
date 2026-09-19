import config from "./config.js";

const schedulerConfig = {
  reportCron: config.app.reportCron,
  timezone: config.app.timezone,
  enableReportScheduler: config.app.enableReportScheduler,
};

export default schedulerConfig;