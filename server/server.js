require("dotenv").config();
const fs = require("fs");
const http = require("http");
const https = require("https");
const connectDB = require("./config/db");
const createApp = require("./app");
const { initSocket } = require("./utils/socket");
const logger = require("./utils/logger");

const app = createApp();
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
  } catch (err) {
    logger.error("Fatal: could not connect to MongoDB, exiting.", { error: err.message });
    process.exit(1);
  }

  // If SSL_KEY_PATH/SSL_CERT_PATH are set, Node terminates TLS itself —
  // useful for a standalone deployment without a reverse proxy in front.
  // Otherwise (the common case), run plain HTTP and let a reverse proxy
  // (Nginx, Render, Heroku, etc.) handle HTTPS termination; FORCE_HTTPS
  // above still protects you if a request somehow arrives over HTTP.
  let server;
  if (process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH) {
    const options = {
      key: fs.readFileSync(process.env.SSL_KEY_PATH),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH)
    };
    server = https.createServer(options, app);
  } else {
    server = http.createServer(app);
  }

  // Socket.IO shares the same HTTP(S) server/port as the REST API — no
  // separate service or port to expose. See utils/socket.js.
  initSocket(server);

  server.listen(PORT, () => {
    const protocol = process.env.SSL_KEY_PATH ? "HTTPS" : "HTTP";
    logger.info(`TalentFlow API running on ${protocol} port ${PORT}`);
  });
}

start();

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason: reason?.message || reason });
});
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", { error: err.message, stack: err.stack });
  process.exit(1);
});
