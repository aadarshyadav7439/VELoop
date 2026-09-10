// Central place mapping an entry currency string to the User balance field
// and the INSUFFICIENT_* error code. Adding a new currency later means
// touching this file only, not scattering `if (currency === "...")`
// throughout controllers (spec section 69 / 13).
const CURRENCY_MAP = {
  VEs: { field: "veBalance", insufficientCode: "INSUFFICIENT_VE_BALANCE" },
  SVEs: { field: "sveBalance", insufficientCode: "INSUFFICIENT_SVE_BALANCE" },
  Tokens: { field: "tokenBalance", insufficientCode: "INSUFFICIENT_TOKEN_BALANCE" }
};

function resolveCurrency(currency) {
  const entry = CURRENCY_MAP[currency];
  if (!entry) {
    throw new Error(`Unsupported currency in giveaway configuration: ${currency}`);
  }
  return entry;
}

module.exports = { CURRENCY_MAP, resolveCurrency };
