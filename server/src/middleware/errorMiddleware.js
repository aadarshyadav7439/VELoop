const ApiError = require("../utils/ApiError");
const env = require("../config/env");

function notFoundHandler(req, res, next) {
  next(ApiError.notFound("ROUTE_NOT_FOUND", "This endpoint doesn't exist."));
}

// Translates Mongo/Mongoose-specific errors into the same stable
// { code, message } shape as ApiError, so nothing raw ever reaches the
// client (spec section 43 — never show `MongoServerError: E11000...`).
function normalizeError(err) {
  if (err instanceof ApiError) return err;

  if (err?.code === 11000) {
    // Duplicate key — almost always our own unique indexes doing their job.
    if (err.keyPattern?.userId && err.keyPattern?.prizeId) {
      return ApiError.conflict("ALREADY_PARTICIPATING", "You're already participating in this giveaway.");
    }
    if (err.keyPattern?.winnerId) {
      return ApiError.conflict("CLAIM_ALREADY_EXISTS", "A claim has already been submitted for this prize.");
    }
    return ApiError.conflict("DUPLICATE_REQUEST", "This action has already been completed.");
  }

  if (err?.name === "ValidationError") {
    return ApiError.badRequest("VALIDATION_ERROR", "Some information isn't valid.");
  }

  if (err?.name === "CastError") {
    return ApiError.badRequest("INVALID_ID", "That giveaway or prize could not be found.");
  }

  return ApiError.internal();
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const apiError = normalizeError(err);

  if (env.nodeEnv !== "production" && apiError.status === 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(apiError.status).json({
    success: false,
    code: apiError.code,
    message: apiError.message,
    details: apiError.details
  });
}

module.exports = { notFoundHandler, errorHandler };
