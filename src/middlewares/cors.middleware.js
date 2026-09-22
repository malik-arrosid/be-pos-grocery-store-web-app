import cors from "cors";
import config from "../config/config.js";

const allowedOrigins = (config.app.clientOrigins || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

console.log("Allowed CORS Origins:", allowedOrigins);

const corsMiddleware = cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return cb(null, true);

    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS allowed: ${origin}`);
      return cb(null, true);
    }

    console.log(`❌ CORS blocked: ${origin}`);
    return cb(new Error(`Origin '${origin}' not allowed by CORS`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "x-requested-with",
    "Cookie",
  ],
  exposedHeaders: ["Set-Cookie", "Content-Disposition"],
});

export default corsMiddleware;
