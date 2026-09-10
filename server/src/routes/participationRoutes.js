const express = require("express");
const participationController = require("../controllers/participationController");
const { requireAuth } = require("../middleware/authMiddleware");
const { attachFraudContext } = require("../middleware/fraudMiddleware");
const { joinLimiter } = require("../middleware/rateLimitMiddleware");
const validate = require("../middleware/validationMiddleware");
const { joinValidator } = require("../validators/participationValidators");

const router = express.Router();

router.get("/:id/my-status", requireAuth, participationController.myStatus);
router.post("/:id/join", requireAuth, joinLimiter, attachFraudContext, joinValidator, validate, participationController.join);

module.exports = router;
