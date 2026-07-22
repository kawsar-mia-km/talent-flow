process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret_do_not_use_in_prod";
process.env.JWT_ACCESS_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN_DAYS = "30";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.FORCE_HTTPS = "false";
process.env.EMAIL_ENABLED = "false";
process.env.AI_SERVICE_ENABLED = "false";
// Generous limits so a full test suite never trips rate limiting.
process.env.AUTH_RATE_LIMIT_MAX = "1000";
process.env.API_RATE_LIMIT_MAX = "5000";
process.env.LOG_LEVEL = "error";
