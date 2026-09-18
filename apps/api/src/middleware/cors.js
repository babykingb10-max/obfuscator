const cors = require("cors");

function buildCorsMiddleware() {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  return cors({
    origin: function (origin, callback) {
      // Allow non-browser tools (no origin header) and any explicitly allowed origin.
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  });
}

module.exports = { buildCorsMiddleware };
