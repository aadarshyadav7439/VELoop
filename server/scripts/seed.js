/* eslint-disable no-console */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const env = require("../src/config/env");
const User = require("../src/models/User");
const Giveaway = require("../src/models/Giveaway");
const Prize = require("../src/models/Prize");
const GiveawayParticipation = require("../src/models/GiveawayParticipation");
const GiveawayEntryTransaction = require("../src/models/GiveawayEntryTransaction");
const GiveawayWinner = require("../src/models/GiveawayWinner");

/**
 * Mirrors src/data/giveawayData.js on the frontend, so the moment this
 * backend is connected the UI shows the same September Rewards event,
 * the same six prizes/fees, and the same August Reward Rush history —
 * just served from MongoDB instead of a hardcoded JS module.
 */
async function seed() {
  await mongoose.connect(env.mongoUri);
  console.log("[seed] Connected. Wiping existing giveaway collections...");

  await Promise.all([
    User.deleteMany({}),
    Giveaway.deleteMany({}),
    Prize.deleteMany({}),
    GiveawayParticipation.deleteMany({}),
    GiveawayEntryTransaction.deleteMany({}),
    GiveawayWinner.deleteMany({})
  ]);

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const demoUser = await User.create({
    displayCode: "VE10025",
    name: "Demo Participant",
    email: "demo@veloop.test",
    passwordHash,
    role: "user",
    veBalance: 850,
    sveBalance: 1200,
    tokenBalance: 5000,
    accountCreatedAt: new Date("2025-01-10T00:00:00Z")
  });

  const adminUser = await User.create({
    displayCode: "VEADMIN1",
    name: "VELOOP Admin",
    email: "admin@veloop.test",
    passwordHash,
    role: "admin",
    veBalance: 0,
    sveBalance: 0,
    tokenBalance: 0,
    accountCreatedAt: new Date("2024-01-01T00:00:00Z")
  });

  // A handful of extra users so winner selection / previous winners has a
  // realistic-looking pool to draw from.
  const extraUsers = await User.insertMany(
    Array.from({ length: 12 }).map((_, i) => ({
      displayCode: `VE1${String(40 + i).padStart(3, "0")}`,
      name: `Demo User ${i + 1}`,
      email: `demo.user${i + 1}@veloop.test`,
      passwordHash,
      veBalance: 400 + i * 30,
      sveBalance: 600 + i * 20,
      tokenBalance: 2500 + i * 100,
      accountCreatedAt: new Date(Date.now() - (30 + i) * 24 * 60 * 60 * 1000)
    }))
  );

  const now = Date.now();
  const currentGiveaway = await Giveaway.create({
    slug: "september-rewards",
    title: "September Rewards",
    heroTitle: "Something valuable could be yours.",
    subtitle: "Complete tasks. Earn entries. Get rewarded.",
    description: "Explore premium rewards, understand the exact entry requirement, and participate with confidence.",
    status: "ACTIVE",
    startAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
    endAt: new Date(now + 11 * 24 * 60 * 60 * 1000),
    nextStartAt: new Date(now + 14 * 24 * 60 * 60 * 1000),
    winnerAnnouncementAt: new Date(now + 11 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
    claimWindowDays: 7,
    eligibility: "Eligible VELOOP users who meet the published participation requirements.",
    rules: [
      { title: "Eligibility", text: "Only eligible VELOOP accounts that satisfy the published event requirements may participate." },
      { title: "Entry requirement", text: "The exact currency and amount are displayed on every reward before confirmation." },
      { title: "Participation", text: "One participation per user per reward." },
      { title: "Winner selection", text: "Winners are finalized after the event closes according to the configured selection process." },
      { title: "Claim period", text: "Winners must submit the required fulfillment details within the configured claim window." },
      { title: "Fraud & abuse", text: "Suspicious, fraudulent, abusive or rule-breaking activity may be rejected or reviewed under platform rules." },
      { title: "Entry/refund policy", text: "Placeholder: the final VELOOP policy for consumed entry currency must be confirmed before production launch." }
    ],
    participationSettings: {
      oneParticipationPerUser: true,
      additionalEntriesAllowed: false,
      reEntryAllowed: false,
      taskEntriesEnabled: true,
      demoLabel: "Seed data — replace with the final VELOOP policy before production."
    },
    statsOverride: { totalGiveaways: 24, participants: 8500, prizesWon: 1200 }
  });

  const prizeDefs = [
    { slug: "iphone-15-pro", position: 1, name: "iPhone 15 Pro", description: "A premium smartphone reward for one selected participant.", image: "/assets/iphone-15-pro.png", winnerCount: 1, prizeType: "PHYSICAL", claimType: "PHYSICAL", entry: { currency: "VEs", amount: 250 }, featured: true, valueLabel: "Prize value: demo / confirm", fulfillment: "Physical delivery after winner verification." },
    { slug: "apple-watch", position: 2, name: "Apple Watch", description: "A premium smartwatch reward for selected participants.", image: "/assets/apple-watch.png", winnerCount: 3, prizeType: "PHYSICAL", claimType: "PHYSICAL", entry: { currency: "VEs", amount: 200 }, featured: true, valueLabel: "Prize value: demo / confirm", fulfillment: "Physical delivery after winner verification." },
    { slug: "airpods-pro", position: 3, name: "AirPods Pro", description: "Premium wireless audio for selected participants.", image: "/assets/airpods-pro.png", winnerCount: 5, prizeType: "PHYSICAL", claimType: "PHYSICAL", entry: { currency: "SVEs", amount: 500 }, featured: true, valueLabel: "Prize value: demo / confirm", fulfillment: "Physical delivery after winner verification." },
    { slug: "amazon-2000", position: 4, name: "₹2,000 Amazon Gift Card", description: "A digital gift card delivered to the winner's email.", image: "/assets/amazon-gift-card-2000.png", winnerCount: 10, prizeType: "GIFT_CARD", claimType: "EMAIL", entry: { currency: "VEs", amount: 500 }, featured: false, valueLabel: "₹2,000", fulfillment: "Digital delivery to the verified claim email." },
    { slug: "amazon-500", position: 5, name: "₹500 Amazon Gift Card", description: "A digital gift card delivered to the winner's email.", image: "/assets/amazon-gift-card-500.png", winnerCount: 10, prizeType: "GIFT_CARD", claimType: "EMAIL", entry: { currency: "VEs", amount: 300 }, featured: false, valueLabel: "₹500", fulfillment: "Digital delivery to the verified claim email." },
    { slug: "amazon-20", position: 6, name: "₹20 Amazon Voucher", description: "A digital reward for selected participants.", image: "/assets/amazon-gift-card-20.png", winnerCount: 20, prizeType: "GIFT_CARD", claimType: "EMAIL", entry: { currency: "Tokens", amount: 2000 }, featured: false, valueLabel: "₹20", fulfillment: "Digital delivery to the verified claim email." }
  ];

  const prizes = await Prize.insertMany(prizeDefs.map((p) => ({ ...p, giveawayId: currentGiveaway._id, participantsCount: 0 })));

  // Demo user joins the Apple Watch prize, matching demoUser.participation in the frontend mock.
  const applewatch = prizes.find((p) => p.slug === "apple-watch");
  const [participation] = await GiveawayParticipation.create([
    {
      userId: demoUser._id,
      giveawayId: currentGiveaway._id,
      prizeId: applewatch._id,
      entryCurrency: applewatch.entry.currency,
      entryAmount: applewatch.entry.amount,
      deviceHash: "seed-device-hash",
      idempotencyKey: "seed-join-demo-user-applewatch",
      status: "SUCCESS"
    }
  ]);
  await GiveawayEntryTransaction.create({
    userId: demoUser._id,
    giveawayId: currentGiveaway._id,
    prizeId: applewatch._id,
    currency: applewatch.entry.currency,
    amount: applewatch.entry.amount,
    type: "ENTRY_FEE",
    status: "SUCCESS",
    balanceBefore: demoUser.veBalance + applewatch.entry.amount,
    balanceAfter: demoUser.veBalance,
    idempotencyKey: "seed-txn-demo-user-applewatch"
  });
  await Prize.updateOne({ _id: applewatch._id }, { $inc: { participantsCount: 1 } });

  // A few extra users join various prizes so participant counts look real.
  for (const [i, user] of extraUsers.entries()) {
    const prize = prizes[i % prizes.length];
    try {
      await GiveawayParticipation.create({
        userId: user._id,
        giveawayId: currentGiveaway._id,
        prizeId: prize._id,
        entryCurrency: prize.entry.currency,
        entryAmount: prize.entry.amount,
        deviceHash: `seed-device-${i}`,
        idempotencyKey: `seed-join-${user._id}`,
        status: "SUCCESS"
      });
      await Prize.updateOne({ _id: prize._id }, { $inc: { participantsCount: 1 } });
    } catch {
      // ignore rare duplicate in seed loop
    }
  }

  // Previous giveaway — August Reward Rush — already ended, with finalized winners.
  const previousGiveaway = await Giveaway.create({
    slug: "august-reward-rush",
    title: "August Reward Rush",
    heroTitle: "August Reward Rush",
    subtitle: "Completed",
    description: "A completed VELOOP rewards event, kept for historical transparency.",
    status: "ARCHIVED",
    startAt: new Date("2026-07-20T00:00:00+05:30"),
    endAt: new Date("2026-08-10T23:59:59+05:30"),
    claimWindowDays: 7,
    eligibility: "Eligible VELOOP users who met the published participation requirements.",
    rules: [],
    participationSettings: { oneParticipationPerUser: true }
  });

  const prevPrize = await Prize.create({
    giveawayId: previousGiveaway._id,
    slug: "august-iphone-15-pro",
    position: 1,
    name: "iPhone 15 Pro",
    description: "August Reward Rush grand prize.",
    image: "/assets/iphone-15-pro.png",
    winnerCount: 1,
    prizeType: "PHYSICAL",
    claimType: "PHYSICAL",
    entry: { currency: "VEs", amount: 250 },
    participantsCount: 1900
  });

  await GiveawayWinner.create({
    giveawayId: previousGiveaway._id,
    prizeId: prevPrize._id,
    userId: extraUsers[0]._id,
    selectionMethod: "RANDOM_DRAW",
    selectedAt: new Date("2026-08-10T18:30:00+05:30"),
    claimDeadline: new Date("2026-08-17T18:30:00+05:30")
  });

  console.log("[seed] Done.");
  console.log(`[seed] Demo user login: demo@veloop.test / Password123! (displayCode ${demoUser.displayCode})`);
  console.log(`[seed] Admin login: admin@veloop.test / Password123!`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
