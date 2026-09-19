import { initializeApp, cert, getApps } from "firebase-admin/app";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import config from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccountPath = path.isAbsolute(
  config.app.firebaseServiceAccountPath,
)
  ? config.app.firebaseServiceAccountPath
  : path.join(__dirname, "..", "..", config.app.firebaseServiceAccountPath);

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount),
    });

export default firebaseApp;