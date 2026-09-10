const FraudEvent = require("../models/FraudEvent");
const GiveawayParticipation = require("../models/GiveawayParticipation");
const env = require("../config/env");

const WINDOW_MS = 15 * 60 * 1000; // signal lookback window for velocity checks

function classify(score) {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}

/**
 * Combines several weak signals into a single 0-100 risk score. No single
 * signal is treated as definitive proof of fraud (spec s.21/25) — e.g.
 * shared IP/device alone never blocks by itself, it only adds weight
 * alongside other signals like account age and request velocity.
 */
async function assessJoinRisk({ userId, deviceHash, prizeId, accountCreatedAt }) {
  const signals = [];
  let score = 0;

  const since = new Date(Date.now() - WINDOW_MS);

  // Signal: same device joining many different prizes/giveaways rapidly.
  const deviceJoinsRecently = await GiveawayParticipation.countDocuments({
    deviceHash,
    createdAt: { $gte: since }
  });
  if (deviceJoinsRecently >= 8) {
    score += 40;
    signals.push("HIGH_DEVICE_JOIN_VELOCITY");
  } else if (deviceJoinsRecently >= 4) {
    score += 15;
    signals.push("ELEVATED_DEVICE_JOIN_VELOCITY");
  }

  // Signal: multiple distinct user accounts joining from the same device
  // recently — possible multi-accounting (spec s.23/25), reviewed not
  // auto-banned since shared networks/devices can be legitimate.
  const distinctUsersOnDevice = await GiveawayParticipation.distinct("userId", {
    deviceHash,
    createdAt: { $gte: since }
  });
  const otherUsers = distinctUsersOnDevice.filter((id) => id.toString() !== userId.toString());
  if (otherUsers.length >= 3) {
    score += 35;
    signals.push("MULTIPLE_ACCOUNTS_SAME_DEVICE");
  } else if (otherUsers.length >= 1) {
    score += 10;
    signals.push("SHARED_DEVICE_DETECTED");
  }

  // Signal: brand-new account attempting to join immediately.
  const accountAgeMs = Date.now() - new Date(accountCreatedAt).getTime();
  if (accountAgeMs < 5 * 60 * 1000) {
    score += 20;
    signals.push("VERY_NEW_ACCOUNT");
  } else if (accountAgeMs < 60 * 60 * 1000) {
    score += 8;
    signals.push("NEW_ACCOUNT");
  }

  score = Math.min(100, score);
  const riskLevel = classify(score);
  const action = score >= env.fraud.blockThreshold ? "BLOCKED" : score >= env.fraud.reviewThreshold ? "FLAGGED" : "ALLOWED";

  return { score, riskLevel, signals, action };
}

async function logFraudEvent({ userId, giveawayId, prizeId, deviceHash, assessment, reason }, session) {
  const [doc] = await FraudEvent.create(
    [
      {
        userId,
        giveawayId,
        prizeId,
        deviceHash,
        riskScore: assessment.score,
        riskLevel: assessment.riskLevel,
        reason,
        signals: assessment.signals,
        action: assessment.action
      }
    ],
    session ? { session } : undefined
  );
  return doc;
}

async function isDeviceRecentlyBlocked(deviceHash) {
  const since = new Date(Date.now() - WINDOW_MS);
  const blocked = await FraudEvent.findOne({
    deviceHash,
    action: "BLOCKED",
    createdAt: { $gte: since }
  }).lean();
  return Boolean(blocked);
}

module.exports = { assessJoinRisk, logFraudEvent, isDeviceRecentlyBlocked };
