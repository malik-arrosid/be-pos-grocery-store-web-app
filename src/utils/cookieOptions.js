import config from "../config/config.js";

const isProduction = (config.app.env || "development") === "production";
const cookieDomain = (config.app.cookieDomain || "").trim();
const rawCookieSecure = (config.app.cookieSecure || "").trim().toLowerCase();
const rawCookieSameSite = (config.app.cookieSameSite || "").trim().toLowerCase();

function normalizeSameSite() {
  if (rawCookieSameSite === "none") return "None";
  if (rawCookieSameSite === "strict") return "Strict";
  if (rawCookieSameSite === "lax") return "Lax";
  return isProduction ? "None" : "Lax";
}

function resolveSecure(sameSite) {
  if (rawCookieSecure === "true") return true;
  if (rawCookieSecure === "false") return false;
  if (sameSite === "None") return true;
  return isProduction;
}

export function getCookieOptions(path) {
  const sameSite = normalizeSameSite();
  const options = {
    httpOnly: true,
    secure: resolveSecure(sameSite),
    sameSite,
    path,
  };

  if (cookieDomain) {
    options.domain = cookieDomain;
  }

  return options;
}