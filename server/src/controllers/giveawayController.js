const asyncHandler = require("../utils/asyncHandler");
const giveawayService = require("../services/giveawayService");
const ApiError = require("../utils/ApiError");

const getCurrent = asyncHandler(async (req, res) => {
  const giveaway = await giveawayService.getCurrent();
  if (!giveaway) {
    // Empty state, not an error — spec section 64 "No Current Giveaway".
    return res.json({ success: true, giveaway: null });
  }
  res.json({ success: true, giveaway });
});

const getOne = asyncHandler(async (req, res) => {
  const giveaway = await giveawayService.getBySlugOrId(req.params.id);
  res.json({ success: true, giveaway });
});

const getPrevious = asyncHandler(async (req, res) => {
  const giveaways = await giveawayService.getPreviousGiveaways();
  res.json({ success: true, giveaways });
});

module.exports = { getCurrent, getOne, getPrevious };
