const mongoose = require("mongoose");

const fraudEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    giveawayId: { type: mongoose.Schema.Types.ObjectId, ref: "Giveaway" },
    prizeId: { type: mongoose.Schema.Types.ObjectId, ref: "Prize" },
    deviceHash: String,

    riskScore: { type: Number, required: true },
    riskLevel: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], required: true },
    reason: String,
    signals: [String],
    action: { type: String, enum: ["ALLOWED", "FLAGGED", "BLOCKED"], required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FraudEvent", fraudEventSchema);
