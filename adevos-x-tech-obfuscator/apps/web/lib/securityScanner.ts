import { SecurityAlert } from "./types";

/**
 * Client-side, regex-based "AI Security Analyzer".
 * Runs entirely in the browser -- the user's source code is never sent
 * to a server for this scan. Flags common secret leaks so the developer
 * can redact or encrypt them before sharing the obfuscated output.
 */
export function analyzeSourceForSecrets(sourceCode: string): SecurityAlert[] {
  const alerts: SecurityAlert[] = [];

  if (!sourceCode || !sourceCode.trim()) {
    return alerts;
  }

  const mongoRegex = /mongodb(?:\+srv)?:\/\/[^\s"'`]+/g;
  if (mongoRegex.test(sourceCode)) {
    alerts.push({
      id: "mongo-uri",
      type: "critical",
      message:
        "A MongoDB connection string appears to be hard-coded. Move it to an environment variable and enable String Array Encoding before sharing this code.",
      suggestedSettings: ["stringArrayEncoding"],
    });
  }

  const sqlUriRegex = /(mysql|postgres(?:ql)?):\/\/[^\s"'`]+/g;
  if (sqlUriRegex.test(sourceCode)) {
    alerts.push({
      id: "sql-uri",
      type: "critical",
      message:
        "A database connection URI appears to be hard-coded. Move it to an environment variable.",
      suggestedSettings: ["stringArrayEncoding"],
    });
  }

  const botTokenRegex = /\b\d{8,10}:[a-zA-Z0-9_-]{35}\b/g;
  if (botTokenRegex.test(sourceCode)) {
    alerts.push({
      id: "bot-token",
      type: "critical",
      message:
        "A value matching a Telegram bot token format was found in plain text. Enable Domain Lock / Token Lock and Dead Code Injection, and rotate the token if this file has ever been shared.",
      suggestedSettings: ["domainLock", "deadCodeInjection"],
    });
  }

  const genericSecretRegex =
    /\b(api[_-]?key|secret[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password)\b\s*[:=]\s*["'`][^"'`\s]{6,}["'`]/gi;
  if (genericSecretRegex.test(sourceCode)) {
    alerts.push({
      id: "generic-secret",
      type: "warning",
      message:
        "A variable that looks like an API key, token, or password is assigned a literal value. Move it to an environment variable and re-run this scan.",
      suggestedSettings: ["stringArrayEncoding"],
    });
  }

  const awsKeyRegex = /\bAKIA[0-9A-Z]{16}\b/g;
  if (awsKeyRegex.test(sourceCode)) {
    alerts.push({
      id: "aws-key",
      type: "critical",
      message:
        "A value matching an AWS access key ID format was found. Remove it from source and rotate the key immediately.",
      suggestedSettings: ["stringArrayEncoding"],
    });
  }

  const privateKeyRegex = /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g;
  if (privateKeyRegex.test(sourceCode)) {
    alerts.push({
      id: "private-key",
      type: "critical",
      message:
        "A private key block appears to be embedded in this file. Private keys should never ship inside application source -- load them from a secrets manager or environment variable instead.",
      suggestedSettings: [],
    });
  }

  if (!/process\.env|import\.meta\.env/.test(sourceCode) && alerts.length > 0) {
    alerts.push({
      id: "no-env-usage",
      type: "info",
      message:
        "No environment-variable access (process.env or import.meta.env) was detected. Consider reading secrets from the environment instead of hard-coding them.",
      suggestedSettings: [],
    });
  }

  return alerts;
}

export function alertsToEnabledSettingKeys(alerts: SecurityAlert[]): string[] {
  const keys = new Set<string>();
  alerts.forEach((a) => a.suggestedSettings.forEach((s) => keys.add(s)));
  return Array.from(keys);
}
