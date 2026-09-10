const mongoose = require("mongoose");

/**
 * Minimal user/wallet model. In production VELOOP already has an auth +
 * wallet system — this exists so the giveaway backend is runnable
 * standalone, and so balances have one authoritative source (never trust
 * a frontend-supplied balance, spec section 66).
 */
const userSchema = new mongoose.Schema(
  {
    displayCode: { type: String, required: true, unique: true }, // e.g. VE10025
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    veBalance: { type: Number, default: 0, min: 0 },
    sveBalance: { type: Number, default: 0, min: 0 },
    tokenBalance: { type: Number, default: 0, min: 0 },

    accountCreatedAt: { type: Date, default: Date.now },
    riskFlags: {
      isSuspicious: { type: Boolean, default: false },
      lastRiskScore: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

userSchema.methods.maskedId = function maskedId() {
  const code = this.displayCode || "";
  if (code.length <= 4) return code;
  return `${code.slice(0, 2)}****${code.slice(-2)}`;
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    displayCode: this.displayCode,
    displayId: this.maskedId(),
    name: this.name,
    email: this.email,
    role: this.role,
    balances: { VEs: this.veBalance, SVEs: this.sveBalance, Tokens: this.tokenBalance }
  };
};

module.exports = mongoose.model("User", userSchema);
