const { body } = require("express-validator");

// Both shapes are accepted here; claimService decides which fields actually
// apply based on the winner's server-side prize.claimType, not on which
// fields happen to be present in the body.
const submitClaimValidator = [
  body("email").optional().isString().trim(),
  body("fullName").optional().isString().trim().isLength({ max: 120 }),
  body("phone").optional().isString().trim().isLength({ max: 20 }),
  body("address").optional().isString().trim().isLength({ max: 300 }),
  body("city").optional().isString().trim().isLength({ max: 100 }),
  body("state").optional().isString().trim().isLength({ max: 100 }),
  body("pinCode").optional().isString().trim().isLength({ max: 12 })
];

module.exports = { submitClaimValidator };
