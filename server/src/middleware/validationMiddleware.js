const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

/**
 * Run after an array of express-validator checks. Collects errors into a
 * single VALIDATION_ERROR response instead of letting bad input reach a
 * controller/service (spec section 45 - "Request validation").
 */
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
  next(ApiError.badRequest("VALIDATION_ERROR", "Some information isn't valid.", details));
}

module.exports = validate;
