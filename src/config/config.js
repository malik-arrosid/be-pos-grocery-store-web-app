import dotenv from "dotenv";
dotenv.config();

const config = {
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  app: {
    baseUrl: process.env.BASE_URL,
    port: process.env.PORT,
    env: process.env.NODE_ENV,
    enableReportScheduler: process.env.ENABLE_REPORT_SCHEDULER,
    reportCron: process.env.REPORT_CRON,
    timezone: process.env.APP_TIMEZONE,
    cookieDomain: process.env.COOKIE_DOMAIN,
    cookieNameAT: process.env.COOKIE_NAME_AT,
    cookieNameRT: process.env.COOKIE_NAME_RT,
    cookieSecure: process.env.COOKIE_SECURE,
    cookieSameSite: process.env.COOKIE_SAME_SITE,
    accessTokenTTL: process.env.ACCESS_TOKEN_TTL,
    refreshTokenTTL: process.env.REFRESH_TOKEN_TTL,
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    // Backward compatibility, will be used as fallback when split secrets are not set
    jwtSecret: process.env.JWT_SECRET,
    // Comma-separated list of allowed client origins
    clientOrigins: process.env.CLIENT_ORIGINS,
    isDev: (process.env.NODE_ENV || "development") !== "production",
    firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    fcmAndroidChannelId: process.env.FCM_ANDROID_CHANNEL_ID || "owner_high_priority",
  },
};

export default config;