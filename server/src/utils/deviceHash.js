const crypto = require("crypto");
const env = require("../config/env");

/**
 * Builds a hashed device/session fingerprint from low-sensitivity signals
 * (User-Agent + Accept-Language + a client-generated device id if present +
 * a truncated/masked IP octet group). We never store raw IP or UA — only
 * a one-way hash — because this is an abuse-prevention signal, not an
 * identity system (see spec section 24).
 */
function maskIp(ip = "") {
  // Drop the last octet/segment so exact IP isn't reversible from the hash's
  // input space, while still keeping enough entropy to catch repeat abuse
  // from the same network range.
  if (ip.includes(".")) {
    return ip.split(".").slice(0, 3).join(".") + ".0";
  }
  if (ip.includes(":")) {
    return ip.split(":").slice(0, 4).join(":") + "::";
  }
  return ip;
}

function getDeviceHash(req) {
  const clientDeviceId = req.headers["x-device-id"] || "";
  const ua = req.headers["user-agent"] || "";
  const lang = req.headers["accept-language"] || "";
  const ip = maskIp(req.ip || req.connection?.remoteAddress || "");

  const raw = `${clientDeviceId}|${ua}|${lang}|${ip}`;
  return crypto.createHmac("sha256", env.jwtSecret).update(raw).digest("hex");
}

module.exports = { getDeviceHash, maskIp };
