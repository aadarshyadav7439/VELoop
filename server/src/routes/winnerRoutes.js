const express = require("express");
const winnerController = require("../controllers/winnerController");
const { optionalAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// Public — but personalizes "did I win?" when a valid token is present.
router.get("/:id/winners", optionalAuth, winnerController.getWinners);
router.get("/:id/my-win", optionalAuth, winnerController.getMyWin);

module.exports = router;
