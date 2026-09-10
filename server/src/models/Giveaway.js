const mongoose = require("mongoose");

/**
 * A Giveaway here is the event-level record shown on the Giveaway Home page
 * (e.g. "September Rewards", GW-2026-09). Each Giveaway owns one or more
 * Prize documents (models/Prize.js) — the iPhone, the Apple Watch, the
 * Amazon vouchers, etc. — each with its own entry fee/currency/winner count,
 * matching the frontend's per-reward join flow (each prize has its own
 * `/giveaway/:slug` page and its own "Join" action).
 *
 * The backend — not the frontend countdown — is authoritative for status.
 * `status` is stored, but effectiveStatus() below is what every read path
 * should use, since a cron/scheduler flips ACTIVE->ENDED, this getter is a
 * safety net for the gap between scheduler ticks.
 */
const ruleSchema = new mongoose.Schema(
  { title: String, text: String },
  { _id: false }
);

const giveawaySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    heroTitle: String,
    subtitle: String,
    description: String,

    status: {
      type: String,
      enum: ["UPCOMING", "ACTIVE", "ENDED", "ARCHIVED"],
      default: "UPCOMING",
      index: true
    },

    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    nextStartAt: Date,
    winnerAnnouncementAt: Date,
    claimWindowDays: { type: Number, default: 7 },

    eligibility: String,
    rules: [ruleSchema],
    participationSettings: {
      oneParticipationPerUser: { type: Boolean, default: true },
      additionalEntriesAllowed: { type: Boolean, default: false },
      reEntryAllowed: { type: Boolean, default: false },
      taskEntriesEnabled: { type: Boolean, default: false },
      demoLabel: String
    },

    // Denormalized display stats. These are cosmetic aggregate counters
    // (section 9/53) — never used for balance or eligibility decisions.
    statsOverride: {
      totalGiveaways: Number,
      participants: Number,
      prizesWon: Number
    }
  },
  { timestamps: true }
);

giveawaySchema.methods.effectiveStatus = function effectiveStatus(now = new Date()) {
  if (this.status === "ARCHIVED") return "ARCHIVED";
  if (now < this.startAt) return "UPCOMING";
  if (now > this.endAt) return this.status === "ARCHIVED" ? "ARCHIVED" : "ENDED";
  return "ACTIVE";
};

module.exports = mongoose.model("Giveaway", giveawaySchema);
