const mongoose = require("mongoose");

/**
 * The authoritative source for everything a malicious client might try to
 * fake: entry currency, entry amount, winner count, prize type. The
 * frontend's /giveaway/:slug page reads one of these; join/claim requests
 * only ever carry a prizeId, never a trusted amount/currency (spec ss.10,40).
 */
const prizeSchema = new mongoose.Schema(
  {
    giveawayId: { type: mongoose.Schema.Types.ObjectId, ref: "Giveaway", required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    position: { type: Number, required: true },
    name: { type: String, required: true },
    description: String,
    image: String,
    valueLabel: String,
    fulfillment: String,

    prizeType: { type: String, enum: ["PHYSICAL", "GIFT_CARD", "DIGITAL"], required: true },
    claimType: { type: String, enum: ["PHYSICAL", "EMAIL"], required: true },

    entry: {
      currency: { type: String, enum: ["VEs", "SVEs", "Tokens"], required: true },
      amount: { type: Number, required: true, min: 0 }
    },

    winnerCount: { type: Number, required: true, min: 1 },
    featured: { type: Boolean, default: false },

    // Denormalized counter, updated on successful join. Display-only.
    participantsCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prize", prizeSchema);
