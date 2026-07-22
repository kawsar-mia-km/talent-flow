const logger = require("./logger");

const ENABLED = !!process.env.REDIS_URL;
let client = null;
let connecting = null;

async function getClient() {
  if (!ENABLED) return null;
  if (client?.isOpen) return client;
  if (connecting) return connecting;

  connecting = (async () => {
    try {
      const { createClient } = require("redis");
      client = createClient({ url: process.env.REDIS_URL });
      client.on("error", (err) => logger.warn("Redis client error", { error: err.message }));
      await client.connect();
      return client;
    } catch (err) {
      logger.warn("Could not connect to Redis, caching disabled for this process", { error: err.message });
      client = null;
      return null;
    } finally {
      connecting = null;
    }
  })();

  return connecting;
}

async function getCached(key) {
  try {
    const c = await getClient();
    if (!c) return null;
    const raw = await c.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    logger.warn("Redis GET failed, treating as cache miss", { key, error: err.message });
    return null;
  }
}

async function setCached(key, value, ttlSeconds = 60) {
  try {
    const c = await getClient();
    if (!c) return;
    await c.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (err) {
    logger.warn("Redis SET failed, continuing without caching this value", { key, error: err.message });
  }
}

/** Invalidate every cached key under a prefix, e.g. "jobs:" after a job is created/edited. */
async function invalidatePrefix(prefix) {
  try {
    const c = await getClient();
    if (!c) return;
    for await (const key of c.scanIterator({ MATCH: `${prefix}*` })) {
      await c.del(key);
    }
  } catch (err) {
    logger.warn("Redis cache invalidation failed", { prefix, error: err.message });
  }
}

module.exports = { isEnabled: () => ENABLED, getCached, setCached, invalidatePrefix };
