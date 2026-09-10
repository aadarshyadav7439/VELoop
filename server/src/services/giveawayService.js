const Giveaway = require("../models/Giveaway");
const Prize = require("../models/Prize");
const GiveawayWinner = require("../models/GiveawayWinner");
const ApiError = require("../utils/ApiError");

// Lowercased status strings match what the existing frontend already
// expects from giveawayCatalog.current.status ("active"/"ended"/"upcoming").
function toFrontendStatus(status) {
  return status.toLowerCase();
}

function shapePrize(prize, winnerCountsByPrize) {
  return {
    id: prize._id.toString(),
    slug: prize.slug,
    position: prize.position,
    name: prize.name,
    description: prize.description,
    image: prize.image,
    winnerCount: prize.winnerCount,
    winnersSelected: winnerCountsByPrize?.[prize._id.toString()] || 0,
    participants: prize.participantsCount,
    prizeType: prize.prizeType,
    claimType: prize.claimType,
    entry: prize.entry,
    featured: prize.featured,
    valueLabel: prize.valueLabel,
    fulfillment: prize.fulfillment
  };
}

async function shapeGiveaway(giveaway) {
  const prizes = await Prize.find({ giveawayId: giveaway._id }).sort({ position: 1 }).lean();
  const status = giveaway.effectiveStatus();

  // Only compute/expose winner counts once the giveaway has actually ended —
  // never let an active giveaway's payload imply winners exist (spec s.21).
  let winnerCountsByPrize = {};
  if (status === "ENDED" || status === "ARCHIVED") {
    const winners = await GiveawayWinner.aggregate([
      { $match: { giveawayId: giveaway._id } },
      { $group: { _id: "$prizeId", count: { $sum: 1 } } }
    ]);
    winnerCountsByPrize = Object.fromEntries(winners.map((w) => [w._id.toString(), w.count]));
  }

  return {
    id: giveaway._id.toString(),
    slug: giveaway.slug,
    title: giveaway.title,
    heroTitle: giveaway.heroTitle,
    subtitle: giveaway.subtitle,
    description: giveaway.description,
    status: toFrontendStatus(status),
    startAt: giveaway.startAt,
    endAt: giveaway.endAt,
    nextStartAt: giveaway.nextStartAt,
    winnerAnnouncementAt: giveaway.winnerAnnouncementAt,
    claimWindowDays: giveaway.claimWindowDays,
    eligibility: giveaway.eligibility,
    rules: giveaway.rules,
    participationSettings: giveaway.participationSettings,
    participants: giveaway.statsOverride?.participants ?? prizes.reduce((s, p) => s + p.participantsCount, 0),
    totalGiveaways: giveaway.statsOverride?.totalGiveaways ?? undefined,
    prizesWon: giveaway.statsOverride?.prizesWon ?? undefined,
    prizes: prizes.map((p) => shapePrize(p, winnerCountsByPrize))
  };
}

async function getCurrent() {
  const now = new Date();
  // "Current" = the giveaway a visitor should see right now: prefer one
  // that's live, fall back to the soonest upcoming one, so the Home page
  // always has something meaningful to render even between events.
  let giveaway = await Giveaway.findOne({ startAt: { $lte: now }, endAt: { $gte: now }, status: { $ne: "ARCHIVED" } })
    .sort({ startAt: -1 })
    .exec();

  if (!giveaway) {
    giveaway = await Giveaway.findOne({ startAt: { $gt: now }, status: { $ne: "ARCHIVED" } })
      .sort({ startAt: 1 })
      .exec();
  }

  if (!giveaway) return null;
  return shapeGiveaway(giveaway);
}

async function getBySlugOrId(idOrSlug) {
  const giveaway = await Giveaway.findOne({
    $or: [{ slug: idOrSlug }, ...(idOrSlug.match(/^[a-f\d]{24}$/i) ? [{ _id: idOrSlug }] : [])]
  });
  if (!giveaway) throw ApiError.notFound("GIVEAWAY_NOT_FOUND", "We couldn't find that giveaway.");
  return shapeGiveaway(giveaway);
}

async function getPreviousGiveaways() {
  const now = new Date();
  const giveaways = await Giveaway.find({
    $or: [{ status: "ARCHIVED" }, { status: "ENDED" }, { endAt: { $lt: now } }]
  })
    .sort({ endAt: -1 })
    .limit(20);

  const results = [];
  for (const giveaway of giveaways) {
    const winners = await GiveawayWinner.find({ giveawayId: giveaway._id })
      .populate("userId", "displayCode")
      .populate("prizeId", "name prizeType");
    results.push({
      id: giveaway._id.toString(),
      slug: giveaway.slug,
      title: giveaway.title,
      endedAt: giveaway.endAt,
      winners: winners.map((w) => ({
        userId: w.userId._id.toString(),
        displayId: w.userId.maskedId(),
        prizeId: w.prizeId._id.toString(),
        prizeName: w.prizeId.name,
        prizeType: w.prizeId.prizeType,
        wonAt: w.selectedAt,
        status: w.status
      }))
    });
  }
  return results;
}

async function findPrize(prizeId) {
  const prize = await Prize.findById(prizeId);
  if (!prize) throw ApiError.notFound("GIVEAWAY_NOT_FOUND", "We couldn't find that reward.");
  return prize;
}

module.exports = { getCurrent, getBySlugOrId, getPreviousGiveaways, findPrize, shapeGiveaway, toFrontendStatus };
