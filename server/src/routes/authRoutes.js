const express = require("express");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimitMiddleware");

const router = express.Router();

router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.get("/me", requireAuth, authController.me);

module.exports = router;
