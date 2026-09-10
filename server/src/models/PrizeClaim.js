const mongoose = require("mongoose");

/**
 * Sensitive fulfillment details live here only. Never returned by any
 * public/list endpoint (spec section 38) — only `getMyClaim` for the
 * authenticated winner themself, and future admin tooling.
 */
const claimSchema = new mongoose.Schema(
  {
    winnerId: { type: mongoose.Schema.Types.ObjectId, ref: "GiveawayWinner", required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    prizeId: { type: mongoose.Schema.Types.ObjectId, ref: "Prize", required: true },
    giveawayId: { type: mongoose.Schema.Types.ObjectId, ref: "Giveaway", required: true },

    claimType: { type: String, enum: ["PHYSICAL", "EMAIL"], required: true },

    // Only the relevant subset is populated/validated per claimType.
    physicalDetails: {
      fullName: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      pinCode: String
    },
    emailDetails: {
      email: String
    },

    status: {
      type: String,
      enum: ["NOT_SUBMITTED", "SUBMITTED", "PROCESSING", "COMPLETED", "EXPIRED"],
      default: "NOT_SUBMITTED"
    },
    submittedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("PrizeClaim", claimSchema);
