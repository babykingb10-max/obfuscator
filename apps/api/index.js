require("dotenv").config();

const express = require("express");
const rateLimit = require("express-rate-limit");
const { buildCorsMiddleware } = require("./src/middleware/cors");
const healthRouter = require("./src/routes/health");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(buildCorsMiddleware());
app.use(express.json({ limit: "1mb" }));

// Basic abuse protection. Obfuscation itself happens client-side, so this API
// currently only needs to protect lightweight endpoints like health checks
// and any future account/history routes.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use("/health", healthRouter);

app.get("/", (req, res) => {
  res.json({ message: "Adevos-X Tech Obfuscator API" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Adevos-X Tech Obfuscator API listening on port ${PORT}`);
});
