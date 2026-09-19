import jwt from "jsonwebtoken";
import config from "../config/config.js";

const authenticate = (req, res, next) => {
  const auth = req.headers.authorization;
  let token = auth?.startsWith("Bearer ") ? auth.split(" ")[1] : null;
  
  if (!token && req.cookies) {
    const name = config.app.cookieNameAT || "access_token";
    token = req.cookies[name] || null;
  }
  
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, config.app.jwtSecret);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ message: "Forbidden" });
  }
};

const authorize = (roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ message: "Akses ditolak" });
  }
  next();
};

export { authenticate, authorize };
