const rateLimit = require("express-rate-limit");
const ApiError = require("../utils/ApiError");

// A shared handler so rate-limit rejections still go through our standard
// { code, message } error shape instead of express-rate-limit's default body.
function rateLimitHandler(req, res, next) {
  next(ApiError.tooMany("Too many requests. Please wait a moment and try again."));
}

const joinLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 6, // generous enough for legitimate double-clicks/retries, tight enough to blunt scripted abuse
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => (req.user ? `user:${req.user.id}` : req.ip)
});

const claimLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => (req.user ? `user:${req.user.id}` : req.ip)
});

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

module.exports = { joinLimiter, claimLimiter, authLimiter, globalLimiter };
