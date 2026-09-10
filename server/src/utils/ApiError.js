/**
 * Every rejected request throws one of these. `code` is a stable machine
 * string the frontend maps to a friendly message (see section 43 of spec) —
 * never expose raw Mongo/JS errors to the client.
 */
class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message || code);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(code, message, details) {
    return new ApiError(400, code, message, details);
  }
  static unauthorized(message = "Please log in to continue.") {
    return new ApiError(401, "LOGIN_REQUIRED", message);
  }
  static forbidden(code, message) {
    return new ApiError(403, code, message);
  }
  static notFound(code, message) {
    return new ApiError(404, code, message);
  }
  static conflict(code, message) {
    return new ApiError(409, code, message);
  }
  static tooMany(message = "Too many requests. Please slow down.") {
    return new ApiError(429, "RATE_LIMITED", message);
  }
  static internal(message = "Something went wrong on our end.") {
    return new ApiError(500, "INTERNAL_ERROR", message);
  }
}

module.exports = ApiError;
