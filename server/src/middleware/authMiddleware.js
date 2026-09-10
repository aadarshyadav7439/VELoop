const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Populates req.user from a verified JWT. The authenticated identity is the
 * ONLY source of truth for "who is making this request" — every downstream
 * service must read req.user.id, never a userId from req.body (spec s.70/74).
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw ApiError.unauthorized("Your session has expired. Please log in again.");
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized();

  req.user = user;
  next();
});

// Attaches req.user if a valid token is present, but never rejects the
// request — used for public read endpoints that personalize output
// (e.g. "is this me in the winner list?") without requiring login.
const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub);
    if (user) req.user = user;
  } catch {
    // Silently ignore — treat as anonymous.
  }
  next();
});

const requireAdmin = (req, res, next) => {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.role !== "admin") {
    throw ApiError.forbidden("ADMIN_REQUIRED", "This action requires an administrator account.");
  }
  next();
};

module.exports = { requireAuth, optionalAuth, requireAdmin };
