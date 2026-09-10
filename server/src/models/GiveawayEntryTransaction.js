const mongoose = require("mongoose");

/**
 * Immutable ledger row per currency movement. Never delete/mutate a row to
 * "undo" it — write a REVERSAL row referencing the original instead, so the
 * financial trail stays intact (spec section 68).
 */
const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    giveawayId: { type: mongoose.Schema.Types.ObjectId, ref: "Giveaway", required: true },
    prizeId: { type: mongoose.Schema.Types.ObjectId, ref: "Prize", required: true },

    currency: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["ENTRY_FEE", "REVERSAL"], default: "ENTRY_FEE" },
    status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED", "REVERSED"], default: "PENDING" },

    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },

    reversalOf: { type: mongoose.Schema.Types.ObjectId, ref: "GiveawayEntryTransaction" },
    idempotencyKey: { type: String, required: true, unique: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("GiveawayEntryTransaction", transactionSchema);
