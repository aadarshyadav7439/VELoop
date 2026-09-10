const mongoose = require("mongoose");

/**
 * One document per successful join. The compound unique index below is the
 * real guarantee against duplicate participation under concurrent requests
 * (spec section 8/18) — application-level `if (alreadyJoined)` checks alone
 * cannot survive two near-simultaneous requests, but a unique index makes
 * the database itself reject the second insert.
 */
const participationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    giveawayId: { type: mongoose.Schema.Types.ObjectId, ref: "Giveaway", required: true },
    prizeId: { type: mongoose.Schema.Types.ObjectId, ref: "Prize", required: true },

    entryCurrency: { type: String, required: true },
    entryAmount: { type: Number, required: true },

    deviceHash: { type: String, required: true },
    idempotencyKey: { type: String, required: true, unique: true },

    status: { type: String, enum: ["SUCCESS", "REVERSED"], default: "SUCCESS" },
    joinedAt: { type: Date, default: Date.now },

    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "GiveawayEntryTransaction" }
  },
  { timestamps: true }
);

// The core anti-duplicate-participation guarantee: one user, one prize, ever.
participationSchema.index({ userId: 1, prizeId: 1 }, { unique: true });
// Cheap device-abuse lookups without exposing raw device data anywhere else.
participationSchema.index({ prizeId: 1, deviceHash: 1 });

module.exports = mongoose.model("GiveawayParticipation", participationSchema);
