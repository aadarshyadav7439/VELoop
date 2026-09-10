const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const Giveaway = require("../models/Giveaway");
const Prize = require("../models/Prize");
const User = require("../models/User");
const GiveawayParticipation = require("../models/GiveawayParticipation");
const GiveawayEntryTransaction = require("../models/GiveawayEntryTransaction");

const ApiError = require("../utils/ApiError");
const { resolveCurrency } = require("../utils/currency");
const balanceService = require("./balanceService");
const fraudService = require("./fraudService");
const auditService = require("./auditService");

/**
 * The join flow described in spec section 41, step by step. Every value
 * used to charge the user (currency, amount) comes from the Prize document
 * loaded server-side — nothing from req.body is trusted for pricing.
 *
 * @param {object} params
 * @param {string} params.userId - from req.user (authenticated identity only)
 * @param {string} params.prizeId - the only giveaway-identifying value trusted from the client
 * @param {string} params.deviceHash - computed by fraudMiddleware
 * @param {string} [params.idempotencyKey] - optional client-supplied key (Idempotency-Key header)
 */
async function join({ userId, prizeId, deviceHash, idempotencyKey }) {
  const prize = await Prize.findById(prizeId);
  if (!prize) throw ApiError.notFound("GIVEAWAY_NOT_FOUND", "We couldn't find that reward.");

  const giveaway = await Giveaway.findById(prize.giveawayId);
  if (!giveaway) throw ApiError.notFound("GIVEAWAY_NOT_FOUND", "We couldn't find that giveaway.");

  const now = new Date();
  const status = giveaway.effectiveStatus(now);

  if (status === "UPCOMING") {
    throw ApiError.badRequest("GIVEAWAY_NOT_ACTIVE", "This giveaway hasn't started yet.");
  }
  if (status === "ENDED" || status === "ARCHIVED" || now < giveaway.startAt || now > giveaway.endAt) {
    throw ApiError.badRequest("GIVEAWAY_ENDED", "This giveaway has ended. Check out the winners and get ready for the next giveaway.");
  }

  const user = await User.findById(userId);
  if (!user) throw ApiError.unauthorized();

  // --- Fraud assessment (read-only, outside the money transaction) -------
  const assessment = await fraudService.assessJoinRisk({
    userId,
    deviceHash,
    prizeId,
    accountCreatedAt: user.accountCreatedAt
  });

  if (assessment.action === "BLOCKED") {
    await fraudService.logFraudEvent({
      userId,
      giveawayId: giveaway._id,
      prizeId: prize._id,
      deviceHash,
      assessment,
      reason: "Join request blocked by fraud risk score"
    });
    await auditService.record({
      action: "JOIN_REJECTED",
      userId,
      giveawayId: giveaway._id,
      prizeId: prize._id,
      result: "FAILURE",
      meta: { reasonCode: "SUSPICIOUS_ACTIVITY", riskScore: assessment.score }
    });
    throw ApiError.forbidden(
      "SUSPICIOUS_ACTIVITY",
      "We couldn't verify this participation request. Please try again later or contact support if you believe this is an error."
    );
  }

  // A quick pre-flight check outside the transaction gives a fast, friendly
  // error for the common case; the real guarantee against a negative
  // balance is the conditional $inc inside the transaction below.
  balanceService.checkSufficientBalance(user, prize.entry.currency, prize.entry.amount);

  const session = await mongoose.startSession();
  let participation;
  let transactionDoc;

  try {
    await session.withTransaction(async () => {
      const { field } = resolveCurrency(prize.entry.currency);

      const balanceBefore = user[field];

      const updatedUser = await User.findOneAndUpdate(
        { _id: userId, [field]: { $gte: prize.entry.amount } },
        { $inc: { [field]: -prize.entry.amount } },
        { new: true, session }
      );
      if (!updatedUser) {
        throw ApiError.badRequest(
          resolveCurrency(prize.entry.currency).insufficientCode,
          `Not enough ${prize.entry.currency}. Your balance changed before this could complete.`
        );
      }

      const resolvedIdempotencyKey = idempotencyKey || uuidv4();

      const [participationDoc] = await GiveawayParticipation.create(
        [
          {
            userId,
            giveawayId: giveaway._id,
            prizeId: prize._id,
            entryCurrency: prize.entry.currency,
            entryAmount: prize.entry.amount,
            deviceHash,
            idempotencyKey: `join:${resolvedIdempotencyKey}`,
            status: "SUCCESS"
          }
        ],
        { session }
      );
      // If this throws E11000 on (userId, prizeId), withTransaction aborts
      // and Mongo rolls back the balance deduction above automatically —
      // no manual "refund" step is needed.

      const [txnDoc] = await GiveawayEntryTransaction.create(
        [
          {
            userId,
            giveawayId: giveaway._id,
            prizeId: prize._id,
            currency: prize.entry.currency,
            amount: prize.entry.amount,
            type: "ENTRY_FEE",
            status: "SUCCESS",
            balanceBefore,
            balanceAfter: updatedUser[field],
            idempotencyKey: `txn:${resolvedIdempotencyKey}`
          }
        ],
        { session }
      );

      participationDoc.transactionId = txnDoc._id;
      await participationDoc.save({ session });

      await Prize.updateOne({ _id: prize._id }, { $inc: { participantsCount: 1 } }, { session });

      if (assessment.action === "FLAGGED") {
        await fraudService.logFraudEvent(
          { userId, giveawayId: giveaway._id, prizeId: prize._id, deviceHash, assessment, reason: "Join allowed but flagged for review" },
          session
        );
      }

      await auditService.record(
        {
          action: "ENTRY_FEE_DEDUCTED",
          userId,
          giveawayId: giveaway._id,
          prizeId: prize._id,
          amount: prize.entry.amount,
          currency: prize.entry.currency,
          result: "SUCCESS",
          meta: { balanceBefore, balanceAfter: updatedUser[field] }
        },
        session
      );
      await auditService.record(
        { action: "JOIN_GIVEAWAY", userId, giveawayId: giveaway._id, prizeId: prize._id, result: "SUCCESS" },
        session
      );

      participation = participationDoc;
      transactionDoc = txnDoc;
    });
  } catch (err) {
    if (err?.code === 11000) {
      await auditService.record({
        action: "DUPLICATE_ATTEMPT",
        userId,
        giveawayId: giveaway._id,
        prizeId: prize._id,
        result: "FAILURE"
      }).catch(() => {});
      throw ApiError.conflict("ALREADY_PARTICIPATING", "You're already participating in this giveaway.");
    }
    throw err;
  } finally {
    await session.endSession();
  }

  return {
    participationId: participation._id.toString(),
    prizeId: prize._id.toString(),
    giveawayId: giveaway._id.toString(),
    entryCurrency: prize.entry.currency,
    entryAmount: prize.entry.amount,
    balanceAfter: transactionDoc.balanceAfter,
    joinedAt: participation.joinedAt
  };
}

/**
 * Shapes "my participation status" for a given giveaway, across every prize
 * in it — this is what the frontend's per-prize CTA state (Join / You're
 * Participating / etc.) and the "Your Entries" panel are driven from.
 */
async function getMyStatus(userId, giveawayId) {
  const prizes = await Prize.find({ giveawayId }).select("_id").lean();
  const prizeIds = prizes.map((p) => p._id);

  const participations = await GiveawayParticipation.find({
    userId,
    prizeId: { $in: prizeIds },
    status: "SUCCESS"
  }).lean();

  return {
    joined: participations.length > 0,
    entries: participations.length,
    joinedPrizeIds: participations.map((p) => p.prizeId.toString())
  };
}

module.exports = { join, getMyStatus };
