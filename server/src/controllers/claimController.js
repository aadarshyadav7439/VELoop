const asyncHandler = require("../utils/asyncHandler");
const claimService = require("../services/claimService");

const getMyClaim = asyncHandler(async (req, res) => {
  const result = await claimService.getMyClaim(req.user.id, req.params.id);
  res.json({ success: true, ...result });
});

const submitClaim = asyncHandler(async (req, res) => {
  const result = await claimService.submitClaim(req.user.id, req.params.id, req.body || {});
  res.status(201).json({ success: true, claim: result });
});

module.exports = { getMyClaim, submitClaim };
