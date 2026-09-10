const express = require("express");
const prizeController = require("../controllers/prizeController");

const router = express.Router();

router.get("/:slug", prizeController.getBySlug);

module.exports = router;
