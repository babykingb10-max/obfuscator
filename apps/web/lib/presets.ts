import { ObfuscationSettings, PresetLevel, ProjectPreset } from "./types";

export const DEFAULT_SETTINGS: ObfuscationSettings = {
  language: "auto",
  level: "medium",
  projectPreset: "none",
  stringArrayEncoding: "base64",
  controlFlowFlattening: false,
  controlFlowFlatteningThreshold: 0.5,
  deadCodeInjection: false,
  deadCodeInjectionThreshold: 0.2,
  renameIdentifiers: true,
  compact: true,
  locks: {
    domainLockEnabled: false,
    domains: "",
    disableConsoleOutput: false,
    selfDefending: false,
    debugProtection: false,
  },
  watermark: {
    enabled: true,
    useCustomName: false,
    customName: "",
  },
  expiry: {
    enabled: false,
    expiryDate: "",
    expiredMessage: "Trial has expired. Please contact the developer.",
  },
};

// Level presets: Low / Medium / High / Extreme (Paranoia)
export function applyLevelPreset(
  settings: ObfuscationSettings,
  level: PresetLevel
): ObfuscationSettings {
  const base = { ...settings, level };

  switch (level) {
    case "low":
      return {
        ...base,
        stringArrayEncoding: "none",
        controlFlowFlattening: false,
        deadCodeInjection: false,
        renameIdentifiers: true,
        compact: true,
        locks: { ...base.locks, selfDefending: false, debugProtection: false },
      };
    case "medium":
      return {
        ...base,
        stringArrayEncoding: "base64",
        controlFlowFlattening: false,
        deadCodeInjection: false,
        renameIdentifiers: true,
        compact: true,
        locks: { ...base.locks, selfDefending: false, debugProtection: false },
      };
    case "high":
      return {
        ...base,
        stringArrayEncoding: "rc4",
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.5,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.2,
        renameIdentifiers: true,
        compact: true,
        locks: { ...base.locks, selfDefending: true, debugProtection: false },
      };
    case "extreme":
      return {
        ...base,
        stringArrayEncoding: "rc4",
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 1,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.5,
        renameIdentifiers: true,
        compact: true,
        locks: { ...base.locks, selfDefending: true, debugProtection: true },
      };
    default:
      return base;
  }
}

// Project-type presets tuned for common developer workflows.
export function applyProjectPreset(
  settings: ObfuscationSettings,
  preset: ProjectPreset
): ObfuscationSettings {
  const base = { ...settings, projectPreset: preset };

  switch (preset) {
    case "node-backend":
      // Heavy obfuscation while keeping process.env reads intact and readable to Node at runtime.
      return {
        ...applyLevelPreset(base, "high"),
        projectPreset: preset,
        locks: { ...base.locks, disableConsoleOutput: false },
      };
    case "react-frontend":
      // Prioritizes minification, identifier renaming, and hardened dev-tools resistance.
      return {
        ...applyLevelPreset(base, "high"),
        projectPreset: preset,
        compact: true,
        locks: { ...base.locks, disableConsoleOutput: true, debugProtection: true },
      };
    case "bot-telegram-whatsapp":
      // Anti-tampering focus: self-defending code plus optional token/domain lock.
      return {
        ...applyLevelPreset(base, "extreme"),
        projectPreset: preset,
        locks: { ...base.locks, selfDefending: true, debugProtection: true },
      };
    default:
      return base;
  }
}

export const LEVEL_DESCRIPTIONS: Record<PresetLevel, string> = {
  low: "Renames identifiers and minifies. Fast, minimal size increase, light protection.",
  medium: "Adds Base64 string encoding on top of Low. Balanced protection and performance.",
  high: "RC4 string encryption, control flow flattening, and dead code injection. Slower at runtime, strong protection.",
  extreme:
    "Maximum control flow flattening and dead code density plus self-defending output. Can noticeably slow down execution.",
  custom: "Manually configured combination of the controls below.",
};
