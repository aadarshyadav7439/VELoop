const asyncHandler = require("../utils/asyncHandler");
const participationService = require("../services/participationService");
const giveawayService = require("../services/giveawayService");
const ApiError = require("../utils/ApiError");

/**
 * The body may only ever contain `prizeId`. Any `amount`, `currency`,
 * `userId` etc. the client sends is ignored entirely (spec s.40) — we
 * don't even read those fields here. The :id route param is the giveaway
 * (event) the client believes it's joining; we independently verify the
 * prize actually belongs to it before proceeding, so a mismatched/stale
 * route param can't be used to bypass giveaway-level checks.
 */
const join = asyncHandler(async (req, res) => {
  const { prizeId } = req.body;
  if (!prizeId) throw ApiError.badRequest("VALIDATION_ERROR", "prizeId is required.");

  const giveaway = await giveawayService.getBySlugOrId(req.params.id);
  const prize = await giveawayService.findPrize(prizeId);
  if (prize.giveawayId.toString() !== giveaway.id) {
    throw ApiError.badRequest("VALIDATION_ERROR", "This reward does not belong to the specified giveaway.");
  }

  const result = await participationService.join({
    userId: req.user.id,
    prizeId,
    deviceHash: req.deviceHash,
    idempotencyKey: req.headers["idempotency-key"]
  });

  res.status(201).json({ success: true, participation: result });
});

const myStatus = asyncHandler(async (req, res) => {
  const giveaway = await giveawayService.getBySlugOrId(req.params.id);
  const status = await participationService.getMyStatus(req.user.id, giveaway.id);
  res.json({ success: true, status });
});

module.exports = { join, myStatus };
