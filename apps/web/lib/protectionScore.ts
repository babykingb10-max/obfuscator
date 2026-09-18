import { ObfuscationSettings } from "./types";

export interface ProtectionScore {
  score: number; // 0-100
  label: "Weak" | "Moderate" | "Strong" | "Maximum";
  color: string;
}

const STRING_ENCODING_POINTS: Record<string, number> = {
  none: 0,
  base64: 10,
  hex: 12,
  rc4: 20,
};

export function calculateProtectionScore(settings: ObfuscationSettings): ProtectionScore {
  let raw = 0;

  raw += STRING_ENCODING_POINTS[settings.stringArrayEncoding] ?? 0;
  if (settings.controlFlowFlattening) {
    raw += 15 + settings.controlFlowFlatteningThreshold * 15; // up to 30
  }
  if (settings.deadCodeInjection) {
    raw += 8 + settings.deadCodeInjectionThreshold * 14; // up to 22
  }
  if (settings.renameIdentifiers) raw += 10;
  if (settings.compact) raw += 3;
  if (settings.locks.domainLockEnabled) raw += 8;
  if (settings.locks.disableConsoleOutput) raw += 4;
  if (settings.locks.selfDefending) raw += 12;
  if (settings.locks.debugProtection) raw += 12;
  if (settings.expiry.enabled) raw += 4;

  const MAX_POSSIBLE = 20 + 30 + 22 + 10 + 3 + 8 + 4 + 12 + 12 + 4; // 125
  const score = Math.max(0, Math.min(100, Math.round((raw / MAX_POSSIBLE) * 100)));

  let label: ProtectionScore["label"];
  let color: string;
  if (score < 25) {
    label = "Weak";
    color = "#ff6b6b";
  } else if (score < 50) {
    label = "Moderate";
    color = "#ffb454";
  } else if (score < 80) {
    label = "Strong";
    color = "#00e39a";
  } else {
    label = "Maximum";
    color = "#8b7cff";
  }

  return { score, label, color };
}
