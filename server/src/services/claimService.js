const GiveawayWinner = require("../models/GiveawayWinner");
const PrizeClaim = require("../models/PrizeClaim");
const Prize = require("../models/Prize");
const ApiError = require("../utils/ApiError");
const auditService = require("./auditService");

/**
 * Loads the caller's own winner record for a giveaway. Every claim
 * operation starts here — `authenticatedUserId === winner.userId` is
 * enforced by the query itself (userId comes from req.user, never from
 * the request body), so there's no `winnerId` a client could tamper with
 * to claim someone else's prize (spec s.34/37).
 */
async function getMyWinnerRecord(userId, giveawayId) {
  const winner = await GiveawayWinner.findOne({ userId, giveawayId }).populate("prizeId");
  return winner;
}

async function getMyClaim(userId, giveawayId) {
  const winner = await getMyWinnerRecord(userId, giveawayId);
  if (!winner) throw ApiError.forbidden("CLAIM_NOT_ALLOWED", "You don't have a prize to claim for this giveaway.");

  const claim = await PrizeClaim.findOne({ winnerId: winner._id });
  return {
    prize: {
      id: winner.prizeId._id.toString(),
      name: winner.prizeId.name,
      prizeType: winner.prizeId.prizeType,
      claimType: winner.prizeId.claimType
    },
    status: winner.status,
    claimDeadline: winner.claimDeadline,
    claim: claim
      ? {
          status: claim.status,
          submittedAt: claim.submittedAt,
          // Sensitive fields intentionally excluded even from this endpoint's
          // list-shape; only surface what the UI needs to render claim state.
        }
      : null
  };
}

function isExpired(winner) {
  return new Date() > new Date(winner.claimDeadline);
}

/**
 * Submits (or re-submits, while still NOT_SUBMITTED) claim details. The
 * claimType — and therefore which fields are required — comes from the
 * winner's Prize document server-side, never from `req.body.type` (spec s.37).
 */
async function submitClaim(userId, giveawayId, payload) {
  const winner = await getMyWinnerRecord(userId, giveawayId);
  if (!winner) {
    throw ApiError.forbidden("CLAIM_NOT_ALLOWED", "You don't have a prize to claim for this giveaway.");
  }

  if (isExpired(winner)) {
    throw ApiError.badRequest("CLAIM_WINDOW_EXPIRED", "The claim window for this prize has expired.");
  }

  const prize = winner.prizeId;
  let claim = await PrizeClaim.findOne({ winnerId: winner._id });

  if (claim && claim.status !== "NOT_SUBMITTED") {
    throw ApiError.conflict("CLAIM_ALREADY_SUBMITTED", "Your claim has already been submitted and is being processed.");
  }

  const update = {
    winnerId: winner._id,
    userId,
    prizeId: prize._id,
    giveawayId,
    claimType: prize.claimType,
    status: "SUBMITTED",
    submittedAt: new Date()
  };

  if (prize.claimType === "EMAIL") {
    const email = (payload.email || "").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw ApiError.badRequest("VALIDATION_ERROR", "Please provide a valid email address.");
    }
    update.emailDetails = { email };
  } else {
    const { fullName, phone, address, city, state, pinCode } = payload;
    const missing = ["fullName", "phone", "address", "city", "state", "pinCode"].filter((f) => !payload[f]?.trim?.());
    if (missing.length) {
      throw ApiError.badRequest("VALIDATION_ERROR", "Please complete all required delivery details.", { missing });
    }
    update.physicalDetails = { fullName, phone, address, city, state, pinCode };
  }

  claim = await PrizeClaim.findOneAndUpdate({ winnerId: winner._id }, update, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  });

  winner.status = "ANNOUNCED"; // winner status itself doesn't change; claim.status is what the UI reads
  await winner.save();

  await auditService.record({
    action: "CLAIM_SUBMITTED",
    userId,
    giveawayId,
    prizeId: prize._id,
    result: "SUCCESS",
    meta: { claimType: prize.claimType }
  });

  return { status: claim.status, submittedAt: claim.submittedAt };
}

module.exports = { getMyWinnerRecord, getMyClaim, submitClaim, isExpired };
