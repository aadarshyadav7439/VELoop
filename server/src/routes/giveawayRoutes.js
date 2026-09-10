const express = require("express");
const giveawayController = require("../controllers/giveawayController");

const router = express.Router();

router.get("/current", giveawayController.getCurrent);
router.get("/previous", giveawayController.getPrevious);
router.get("/:id", giveawayController.getOne);

module.exports = router;
