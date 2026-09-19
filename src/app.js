import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import corsMiddleware from "./middlewares/cors.middleware.js";

import authRoutes from "./routes/auth/authRoutes.js";
import roleAuthRoutes from "./routes/auth/roleAuthRoutes.js";
import { createRoleRoutes } from "./routes/role/roleRoutes.js";
import ownerRoutes from "./routes/owner/ownerRoutes.js";

const adminRoleRoutes = createRoleRoutes();
const kasirRoleRoutes = createRoleRoutes();
const ownerRoleRoutes = createRoleRoutes({
  includeNotifications: true,
  includeFcm: true,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("trust proxy", 1);

// Logging middleware to log request method, URL, origin, and host
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log("Headers:", req.headers);
  console.log("Cookies:", req.cookies);
  next();
});

app.use(corsMiddleware);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/admin", roleAuthRoutes, adminRoleRoutes);
app.use("/api/kasir", roleAuthRoutes, kasirRoleRoutes);
app.use("/api/owner", roleAuthRoutes, ownerRoleRoutes, ownerRoutes);

export default app;