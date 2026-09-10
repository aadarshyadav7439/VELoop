const { resolveCurrency } = require("../utils/currency");
const ApiError = require("../utils/ApiError");

function checkSufficientBalance(user, currency, amount) {
  const { field, insufficientCode } = resolveCurrency(currency);
  const balance = user[field];
  if (balance < amount) {
    const shortfall = amount - balance;
    throw ApiError.badRequest(
      insufficientCode,
      `Not enough ${currency}. You need ${shortfall} more ${currency} to participate.`,
      { balance, required: amount, shortfall, currency }
    );
  }
  return { field, balance };
}

/**
 * Atomically decrements the user's balance for the given currency inside an
 * existing session/transaction, using a conditional filter (balance >=
 * amount) so a race between two concurrent requests can't push the balance
 * negative even if both passed the earlier read-only check (spec s.14/18).
 */
async function deductBalance(User, userId, currency, amount, session) {
  const { field } = resolveCurrency(currency);
  const updated = await User.findOneAndUpdate(
    { _id: userId, [field]: { $gte: amount } },
    { $inc: { [field]: -amount } },
    { new: true, session }
  );
  if (!updated) {
    throw ApiError.badRequest(
      resolveCurrency(currency).insufficientCode,
      `Not enough ${currency} to complete this action.`
    );
  }
  return updated;
}

module.exports = { checkSufficientBalance, deductBalance };
