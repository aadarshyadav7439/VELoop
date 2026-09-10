const mongoose = require("mongoose");

const winnerSchema = new mongoose.Schema(
  {
    giveawayId: { type: mongoose.Schema.Types.ObjectId, ref: "Giveaway", required: true, index: true },
    prizeId: { type: mongoose.Schema.Types.ObjectId, ref: "Prize", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    selectionMethod: { type: String, enum: ["RANDOM_DRAW", "MANUAL_ADMIN"], default: "RANDOM_DRAW" },
    selectedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["ANNOUNCED", "REVOKED"], default: "ANNOUNCED" },

    claimDeadline: { type: Date, required: true }
  },
  { timestamps: true }
);

// A user can only win a given prize once, and this also lets us safely
// enforce winnerCount by counting documents per prizeId (spec 32/33).
winnerSchema.index({ prizeId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("GiveawayWinner", winnerSchema);
