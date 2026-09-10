const express = require("express");
const claimController = require("../controllers/claimController");
const { requireAuth } = require("../middleware/authMiddleware");
const { claimLimiter } = require("../middleware/rateLimitMiddleware");
const validate = require("../middleware/validationMiddleware");
const { submitClaimValidator } = require("../validators/claimValidators");

const router = express.Router();

router.get("/:id/my-claim", requireAuth, claimController.getMyClaim);
router.post("/:id/claim", requireAuth, claimLimiter, submitClaimValidator, validate, claimController.submitClaim);

module.exports = router;
