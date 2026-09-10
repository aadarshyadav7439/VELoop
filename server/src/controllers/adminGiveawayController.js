const asyncHandler = require("../utils/asyncHandler");
const Giveaway = require("../models/Giveaway");
const Prize = require("../models/Prize");
const ApiError = require("../utils/ApiError");
const auditService = require("../services/auditService");
const winnerService = require("../services/winnerService");
const giveawayService = require("../services/giveawayService");

/**
 * Every handler in this file is mounted behind requireAuth + requireAdmin
 * (see routes/adminRoutes.js) — knowing the URL is never sufficient to
 * create a giveaway or select winners (spec section 49).
 */

const createGiveaway = asyncHandler(async (req, res) => {
  const giveaway = await Giveaway.create(req.body);
  await auditService.record({ action: "ADMIN_GIVEAWAY_CREATED", userId: req.user.id, giveawayId: giveaway._id, result: "SUCCESS" });
  res.status(201).json({ success: true, giveaway });
});

const updateGiveaway = asyncHandler(async (req, res) => {
  const giveaway = await Giveaway.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!giveaway) throw ApiError.notFound("GIVEAWAY_NOT_FOUND", "We couldn't find that giveaway.");
  await auditService.record({ action: "ADMIN_GIVEAWAY_UPDATED", userId: req.user.id, giveawayId: giveaway._id, result: "SUCCESS" });
  res.json({ success: true, giveaway });
});

const setStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["UPCOMING", "ACTIVE", "ENDED", "ARCHIVED"].includes(status)) {
    throw ApiError.badRequest("VALIDATION_ERROR", "Invalid status value.");
  }
  const giveaway = await Giveaway.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!giveaway) throw ApiError.notFound("GIVEAWAY_NOT_FOUND", "We couldn't find that giveaway.");
  await auditService.record({
    action: "ADMIN_STATUS_CHANGED",
    userId: req.user.id,
    giveawayId: giveaway._id,
    result: "SUCCESS",
    meta: { status }
  });
  res.json({ success: true, giveaway });
});

const addPrize = asyncHandler(async (req, res) => {
  const giveaway = await Giveaway.findById(req.params.id);
  if (!giveaway) throw ApiError.notFound("GIVEAWAY_NOT_FOUND", "We couldn't find that giveaway.");
  const prize = await Prize.create({ ...req.body, giveawayId: giveaway._id });
  res.status(201).json({ success: true, prize });
});

const updatePrize = asyncHandler(async (req, res) => {
  const prize = await Prize.findByIdAndUpdate(req.params.prizeId, req.body, { new: true, runValidators: true });
  if (!prize) throw ApiError.notFound("GIVEAWAY_NOT_FOUND", "We couldn't find that reward.");
  res.json({ success: true, prize });
});

const selectWinners = asyncHandler(async (req, res) => {
  const winners = await winnerService.selectWinnersForPrize(req.params.prizeId, req.user.id);
  res.status(201).json({ success: true, winners });
});

const listParticipation = asyncHandler(async (req, res) => {
  // Kept intentionally minimal — a full admin participation dashboard is
  // outside this task's scope, but the read path is here so it can grow.
  const giveaway = await giveawayService.getBySlugOrId(req.params.id);
  res.json({ success: true, giveaway });
});

module.exports = { createGiveaway, updateGiveaway, setStatus, addPrize, updatePrize, selectWinners, listParticipation };
