const { body } = require("express-validator");

// Deliberately whitelists ONLY prizeId — this is what makes it structurally
// impossible for a validated request to also carry a trusted amount/currency.
const joinValidator = [body("prizeId").isString().trim().notEmpty().withMessage("prizeId is required.")];

module.exports = { joinValidator };
