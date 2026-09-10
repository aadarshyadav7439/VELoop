const app = require("./src/app");
const connectDB = require("./src/config/db");
const env = require("./src/config/env");

async function start() {
  await connectDB();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] VELOOP Giveaway backend listening on port ${env.port} (${env.nodeEnv})`);
  });
}

start();
