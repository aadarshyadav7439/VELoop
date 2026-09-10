const asyncHandler = require("../utils/asyncHandler");
const Prize = require("../models/Prize");
const Giveaway = require("../models/Giveaway");
const ApiError = require("../utils/ApiError");

/**
 * Backs the individual giveaway page (spec s.79-103), e.g. GET
 * /api/prizes/iphone-15-pro. Returns the prize plus enough parent-giveaway
 * context (status, countdown bounds, rules) for that page to render fully
 * without a second request — including sibling prizes from the same
 * giveaway, so the "explore other rewards" section doesn't need a second
 * round trip either.
 */
const getBySlug = asyncHandler(async (req, res) => {
  const prize = await Prize.findOne({ slug: req.params.slug });
  if (!prize) throw ApiError.notFound("GIVEAWAY_NOT_FOUND", "We couldn't find that giveaway.");

  const giveaway = await Giveaway.findById(prize.giveawayId);
  if (!giveaway) throw ApiError.notFound("GIVEAWAY_NOT_FOUND", "We couldn't find that giveaway.");

  const status = giveaway.effectiveStatus();

  const siblings = await Prize.find({ giveawayId: giveaway._id, _id: { $ne: prize._id } })
    .sort({ position: 1 })
    .limit(6)
    .lean();

  const shapeSibling = (p) => ({
    id: p._id.toString(),
    slug: p.slug,
    position: p.position,
    name: p.name,
    image: p.image,
    entry: p.entry
  });

  res.json({
    success: true,
    prize: {
      id: prize._id.toString(),
      slug: prize.slug,
      name: prize.name,
      description: prize.description,
      image: prize.image,
      valueLabel: prize.valueLabel,
      fulfillment: prize.fulfillment,
      prizeType: prize.prizeType,
      claimType: prize.claimType,
      entry: prize.entry,
      winnerCount: prize.winnerCount,
      participants: prize.participantsCount
    },
    siblingPrizes: siblings.map(shapeSibling),
    giveaway: {
      id: giveaway._id.toString(),
      slug: giveaway.slug,
      title: giveaway.title,
      status: status.toLowerCase(),
      startAt: giveaway.startAt,
      endAt: giveaway.endAt,
      nextStartAt: giveaway.nextStartAt,
      eligibility: giveaway.eligibility,
      rules: giveaway.rules,
      participationSettings: giveaway.participationSettings,
      claimWindowDays: giveaway.claimWindowDays
    }
  });
});

module.exports = { getBySlug };
