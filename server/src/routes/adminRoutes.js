const express = require("express");
const adminController = require("../controllers/adminGiveawayController");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.post("/giveaways", adminController.createGiveaway);
router.patch("/giveaways/:id", adminController.updateGiveaway);
router.patch("/giveaways/:id/status", adminController.setStatus);
router.get("/giveaways/:id/participation", adminController.listParticipation);

router.post("/giveaways/:id/prizes", adminController.addPrize);
router.patch("/prizes/:prizeId", adminController.updatePrize);
router.post("/prizes/:prizeId/select-winners", adminController.selectWinners);

module.exports = router;
