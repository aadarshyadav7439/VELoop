const mongoose = require("mongoose");
const Prize = require("../models/Prize");
const Giveaway = require("../models/Giveaway");
const GiveawayParticipation = require("../models/GiveawayParticipation");
const GiveawayWinner = require("../models/GiveawayWinner");
const ApiError = require("../utils/ApiError");
const auditService = require("./auditService");

/**
 * Admin-only. Randomly selects winners for a prize from its eligible
 * participant pool, strictly bounded by prize.winnerCount — even if this
 * were somehow invoked twice, the unique(prizeId, userId) index plus the
 * "how many more do we need" calculation below prevents over-selecting.
 */
async function selectWinnersForPrize(prizeId, adminUserId) {
  const prize = await Prize.findById(prizeId);
  if (!prize) throw ApiError.notFound("GIVEAWAY_NOT_FOUND", "We couldn't find that reward.");

  const giveaway = await Giveaway.findById(prize.giveawayId);
  if (!giveaway) throw ApiError.notFound("GIVEAWAY_NOT_FOUND", "We couldn't find that giveaway.");

  if (giveaway.effectiveStatus() === "ACTIVE") {
    throw ApiError.badRequest("GIVEAWAY_NOT_ACTIVE", "Winners can only be selected after the giveaway ends.");
  }

  const alreadySelected = await GiveawayWinner.countDocuments({ prizeId: prize._id });
  const remainingSlots = prize.winnerCount - alreadySelected;
  if (remainingSlots <= 0) {
    return GiveawayWinner.find({ prizeId: prize._id });
  }

  const existingWinnerUserIds = (await GiveawayWinner.find({ prizeId: prize._id }).select("userId")).map((w) =>
    w.userId.toString()
  );

  const eligibleParticipants = await GiveawayParticipation.aggregate([
    { $match: { prizeId: prize._id, status: "SUCCESS", userId: { $nin: existingWinnerUserIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
    { $sample: { size: remainingSlots } }
  ]);

  if (eligibleParticipants.length === 0) {
    return GiveawayWinner.find({ prizeId: prize._id });
  }

  const claimDeadline = new Date(Date.now() + giveaway.claimWindowDays * 24 * 60 * 60 * 1000);

  const docs = eligibleParticipants.map((p) => ({
    giveawayId: giveaway._id,
    prizeId: prize._id,
    userId: p.userId,
    selectionMethod: "RANDOM_DRAW",
    claimDeadline
  }));

  const created = await GiveawayWinner.insertMany(docs, { ordered: false }).catch((err) => {
    // Partial unique-index collisions (e.g. re-run after a crash) are fine —
    // surface everything that DID get inserted rather than failing the whole batch.
    if (err?.writeErrors) return err.insertedDocs || [];
    throw err;
  });

  for (const winner of created) {
    await auditService.record({
      action: "WINNER_SELECTED",
      userId: winner.userId,
      giveawayId: giveaway._id,
      prizeId: prize._id,
      result: "SUCCESS",
      meta: { selectedBy: adminUserId, selectionMethod: "RANDOM_DRAW" }
    });
  }

  return GiveawayWinner.find({ prizeId: prize._id });
}

async function getWinnersForGiveaway(giveawayId) {
  const giveaway = await Giveaway.findById(giveawayId);
  if (!giveaway) throw ApiError.notFound("GIVEAWAY_NOT_FOUND", "We couldn't find that giveaway.");

  const status = giveaway.effectiveStatus();
  if (status === "ACTIVE" || status === "UPCOMING") {
    // Never fabricate winners for a live giveaway (spec s.21).
    return { finalized: false, winners: [] };
  }

  const winners = await GiveawayWinner.find({ giveawayId })
    .populate("userId", "displayCode")
    .populate("prizeId", "name prizeType")
    .sort({ selectedAt: 1 });

  return {
    finalized: true,
    winners: winners.map((w) => ({
      userId: w.userId._id.toString(),
      displayId: w.userId.maskedId(),
      prizeId: w.prizeId._id.toString(),
      prizeName: w.prizeId.name,
      prizeType: w.prizeId.prizeType,
      wonAt: w.selectedAt,
      status: w.status
    }))
  };
}

async function findMyWin(userId, giveawayId) {
  return GiveawayWinner.findOne({ userId, giveawayId }).populate("prizeId");
}

module.exports = { selectWinnersForPrize, getWinnersForGiveaway, findMyWin };
