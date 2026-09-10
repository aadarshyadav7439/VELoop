const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");

const env = require("./config/env");
const { globalLimiter } = require("./middleware/rateLimitMiddleware");
const { notFoundHandler, errorHandler } = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const giveawayRoutes = require("./routes/giveawayRoutes");
const participationRoutes = require("./routes/participationRoutes");
const winnerRoutes = require("./routes/winnerRoutes");
const claimRoutes = require("./routes/claimRoutes");
const prizeRoutes = require("./routes/prizeRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.set("trust proxy", 1); // needed for req.ip to be accurate behind a proxy/load balancer

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true
  })
);
app.use(express.json({ limit: "50kb" })); // small payload cap — claims/joins never need more
app.use(mongoSanitize()); // strips $/. operators from user input to block NoSQL injection
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(globalLimiter);

app.get("/health", (req, res) => res.json({ success: true, status: "ok", time: new Date().toISOString() }));

// Every giveaway sub-resource (join/winners/claim/my-status) hangs off the
// same /api/giveaways/:id prefix as separate routers, matched by path shape.
app.use("/api/auth", authRoutes);
app.use("/api/giveaways", giveawayRoutes);
app.use("/api/giveaways", participationRoutes);
app.use("/api/giveaways", winnerRoutes);
app.use("/api/giveaways", claimRoutes);
app.use("/api/prizes", prizeRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
