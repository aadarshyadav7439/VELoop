const AuditLog = require("../models/AuditLog");

/**
 * Fire-and-forget-ish audit writer. Accepts an optional Mongoose session so
 * writes made mid-transaction are recorded atomically with the rest of the
 * join/claim flow, but a logging failure should never itself fail the
 * request the way a balance or participation error should — so callers
 * outside a transaction may ignore this promise's rejection.
 */
async function record({ action, userId, giveawayId, prizeId, amount, currency, result, requestId, meta }, session) {
  const [doc] = await AuditLog.create(
    [{ action, userId, giveawayId, prizeId, amount, currency, result, requestId, meta }],
    session ? { session } : undefined
  );
  return doc;
}

module.exports = { record };
