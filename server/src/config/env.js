require("dotenv").config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    // Fail loudly at boot rather than silently misbehaving at request time.
    // eslint-disable-next-line no-console
    console.error(`[config] Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

module.exports = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: required("MONGO_URI"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  refreshSecret: required("REFRESH_SECRET"),
  refreshExpiresIn: process.env.REFRESH_EXPIRES_IN || "7d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  fraud: {
    blockThreshold: Number(process.env.FRAUD_BLOCK_THRESHOLD || 80),
    reviewThreshold: Number(process.env.FRAUD_REVIEW_THRESHOLD || 60)
  }
};
