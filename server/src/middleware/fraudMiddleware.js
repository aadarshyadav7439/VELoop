const asyncHandler = require("../utils/asyncHandler");
const { getDeviceHash } = require("../utils/deviceHash");
const fraudService = require("../services/fraudService");
const ApiError = require("../utils/ApiError");

/**
 * Attaches a hashed device fingerprint to every request, and short-circuits
 * requests from a device that's already been blocked recently. The deeper,
 * per-attempt risk scoring happens inside participationService as part of
 * the join transaction, because it needs giveaway/user context this
 * middleware doesn't have yet.
 */
const attachFraudContext = asyncHandler(async (req, res, next) => {
  req.deviceHash = getDeviceHash(req);
  const recentlyBlocked = await fraudService.isDeviceRecentlyBlocked(req.deviceHash);
  if (recentlyBlocked) {
    throw ApiError.forbidden(
      "SUSPICIOUS_ACTIVITY",
      "We couldn't verify this participation request. Please try again later or contact support if you believe this is an error."
    );
  }
  next();
});

module.exports = { attachFraudContext };
