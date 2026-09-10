const asyncHandler = require("../utils/asyncHandler");
const winnerService = require("../services/winnerService");

const getWinners = asyncHandler(async (req, res) => {
  const result = await winnerService.getWinnersForGiveaway(req.params.id);
  res.json({ success: true, ...result });
});

// Personalizes the winners response for a logged-in caller: whether *they*
// won something in this giveaway, without exposing anyone else's claim data.
const getMyWin = asyncHandler(async (req, res) => {
  if (!req.user) return res.json({ success: true, won: false });
  const winner = await winnerService.findMyWin(req.user.id, req.params.id);
  if (!winner) return res.json({ success: true, won: false });
  res.json({
    success: true,
    won: true,
    prize: { id: winner.prizeId._id.toString(), name: winner.prizeId.name, prizeType: winner.prizeId.prizeType },
    claimDeadline: winner.claimDeadline
  });
});

module.exports = { getWinners, getMyWin };
