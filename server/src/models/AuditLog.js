const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        "JOIN_GIVEAWAY",
        "ENTRY_FEE_DEDUCTED",
        "JOIN_REJECTED",
        "DUPLICATE_ATTEMPT",
        "FRAUD_FLAGGED",
        "CLAIM_SUBMITTED",
        "CLAIM_STATUS_CHANGED",
        "WINNER_SELECTED",
        "ADMIN_GIVEAWAY_CREATED",
        "ADMIN_GIVEAWAY_UPDATED",
        "ADMIN_STATUS_CHANGED"
      ],
      required: true
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    giveawayId: { type: mongoose.Schema.Types.ObjectId, ref: "Giveaway" },
    prizeId: { type: mongoose.Schema.Types.ObjectId, ref: "Prize" },
    amount: Number,
    currency: String,
    result: { type: String, enum: ["SUCCESS", "FAILURE"], required: true },
    requestId: String,
    meta: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
