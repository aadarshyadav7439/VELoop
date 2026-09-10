const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const env = require("../config/env");

/**
 * VELOOP already has its own auth system in production (spec section 2).
 * This controller exists only so the giveaway backend can be run,
 * demoed and tested standalone — swap it for the real auth
 * service/middleware without touching giveaway/participation/claim logic,
 * which only ever depend on req.user being populated correctly.
 */
function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw ApiError.badRequest("VALIDATION_ERROR", "Name, email and password are required.");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict("EMAIL_IN_USE", "An account with this email already exists.");

  const passwordHash = await bcrypt.hash(password, 10);
  const count = await User.countDocuments();
  const displayCode = `VE${10000 + count + 1}`;

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    displayCode,
    // Demo starting balances so a freshly registered account can try the flow immediately.
    veBalance: 500,
    sveBalance: 500,
    tokenBalance: 3000
  });

  res.status(201).json({ success: true, token: signToken(user), user: user.toPublicJSON() });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || "").toLowerCase() });
  if (!user) throw ApiError.badRequest("INVALID_CREDENTIALS", "Incorrect email or password.");

  const ok = await bcrypt.compare(password || "", user.passwordHash);
  if (!ok) throw ApiError.badRequest("INVALID_CREDENTIALS", "Incorrect email or password.");

  res.json({ success: true, token: signToken(user), user: user.toPublicJSON() });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toPublicJSON() });
});

module.exports = { register, login, me };
