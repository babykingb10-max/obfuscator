import JavaScriptObfuscator from "javascript-obfuscator";
import { ObfuscationResult, ObfuscationSettings, SourceLanguage } from "./types";
import { detectLanguage } from "./languageDetect";
import { transpileToJavaScript } from "./transpile";
import { extractInlineScripts, minifyHtml, reinsertScripts } from "./htmlProcessor";
import { minifyCss } from "./cssProcessor";
import { minifyJson } from "./jsonProcessor";

export class ObfuscationSyntaxError extends Error {
  line?: number;
  column?: number;

  constructor(message: string, line?: number, column?: number) {
    super(message);
    this.name = "ObfuscationSyntaxError";
    this.line = line;
    this.column = column;
  }
}

function byteSize(str: string): number {
  return new TextEncoder().encode(str).length;
}

function countLines(str: string): number {
  if (!str) return 0;
  return str.split("\n").length - 1;
}

function parseErrorLocation(err: any): { line?: number; column?: number } {
  if (err?.loc?.line) {
    return { line: err.loc.line, column: err.loc.column };
  }
  const parens = /\((\d+):(\d+)\)/.exec(err?.message ?? "");
  if (parens) {
    return { line: Number(parens[1]), column: Number(parens[2]) };
  }
  const lineOnly = /line\s+(\d+)/i.exec(err?.message ?? "");
  if (lineOnly) {
    return { line: Number(lineOnly[1]) };
  }
  return {};
}

function cleanErrorMessage(message: string): string {
  return message.replace(/\s*\(\d+:\d+\)\s*$/, "").trim();
}

function buildExpiryGuard(settings: ObfuscationSettings): string {
  if (!settings.expiry.enabled || !settings.expiry.expiryDate) return "";
  const timestamp = new Date(settings.expiry.expiryDate).getTime();
  if (Number.isNaN(timestamp)) return "";
  const message = JSON.stringify(
    settings.expiry.expiredMessage || "Trial has expired."
  );
  return `if (Date.now() > ${timestamp}) { throw new Error(${message}); }\n`;
}

function buildDomainLockGuard(settings: ObfuscationSettings): string {
  if (!settings.locks.domainLockEnabled || !settings.locks.domains.trim())
    return "";
  const domains = settings.locks.domains
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
  if (domains.length === 0) return "";
  const list = JSON.stringify(domains);
  return `if (typeof window !== "undefined" && ${list}.indexOf(window.location.hostname) === -1) { throw new Error("Unauthorized domain."); }\n`;
}

function buildJsWatermark(settings: ObfuscationSettings, brandName: string): string {
  if (!settings.watermark.enabled) return "";
  if (settings.watermark.useCustomName && settings.watermark.customName.trim()) {
    return `/*\n * Obfuscated by ${settings.watermark.customName.trim()}\n * Powered by ${brandName}\n */\n`;
  }
  return `/*\n * Obfuscated & secured by ${brandName}\n * Advanced code protection engine\n */\n`;
}

function buildHtmlWatermark(settings: ObfuscationSettings, brandName: string): string {
  if (!settings.watermark.enabled) return "";
  const who =
    settings.watermark.useCustomName && settings.watermark.customName.trim()
      ? settings.watermark.customName.trim()
      : brandName;
  return `<!-- Obfuscated & secured by ${who} | Powered by ${brandName} -->\n`;
}

function buildCssWatermark(settings: ObfuscationSettings, brandName: string): string {
  if (!settings.watermark.enabled) return "";
  const who =
    settings.watermark.useCustomName && settings.watermark.customName.trim()
      ? settings.watermark.customName.trim()
      : brandName;
  return `/* Secured by ${who} | Powered by ${brandName} */\n`;
}

/**
 * Runs the actual javascript-obfuscator pass over a plain-JavaScript string.
 * Used directly for .js/.ts/.jsx/.tsx input, and reused internally to
 * obfuscate each <script> block found inside an .html file.
 */
function obfuscateJavaScript(jsSource: string, settings: ObfuscationSettings): string {
  const expiryGuard = buildExpiryGuard(settings);
  const domainGuard = buildDomainLockGuard(settings);
  const guardLineOffset = countLines(expiryGuard) + countLines(domainGuard);
  const guardedSource = expiryGuard + domainGuard + jsSource;

  const stringArrayEncoding =
    settings.stringArrayEncoding === "none" ? [] : [settings.stringArrayEncoding];

  try {
    return JavaScriptObfuscator.obfuscate(guardedSource, {
      compact: settings.compact,
      controlFlowFlattening: settings.controlFlowFlattening,
      controlFlowFlatteningThreshold: settings.controlFlowFlatteningThreshold,
      deadCodeInjection: settings.deadCodeInjection,
      deadCodeInjectionThreshold: settings.deadCodeInjectionThreshold,
      identifierNamesGenerator: settings.renameIdentifiers ? "hexadecimal" : "mangled",
      renameGlobals: false,
      stringArray: settings.stringArrayEncoding !== "none",
      stringArrayEncoding: stringArrayEncoding as any,
      stringArrayThreshold: settings.stringArrayEncoding !== "none" ? 0.75 : 0,
      disableConsoleOutput: settings.locks.disableConsoleOutput,
      selfDefending: settings.locks.selfDefending,
      debugProtection: settings.locks.debugProtection,
      debugProtectionInterval: settings.locks.debugProtection ? 2000 : 0,
      domainLock: settings.locks.domainLockEnabled
        ? settings.locks.domains
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean)
        : [],
      numbersToExpressions: settings.level === "extreme",
      simplify: true,
      splitStrings: settings.level === "extreme",
      splitStringsChunkLength: 8,
      transformObjectKeys: settings.level === "high" || settings.level === "extreme",
      unicodeEscapeSequence: false,
    }).getObfuscatedCode();
  } catch (err: any) {
    const { line, column } = parseErrorLocation(err);
    const adjustedLine =
      line !== undefined ? Math.max(1, line - guardLineOffset) : undefined;
    throw new ObfuscationSyntaxError(
      cleanErrorMessage(err?.message ?? "Unable to parse this code."),
      adjustedLine,
      column
    );
  }
}

function processJavaScriptFamily(
  sourceCode: string,
  settings: ObfuscationSettings,
  brandName: string,
  resolvedLanguage: Extract<SourceLanguage, "javascript" | "typescript" | "jsx" | "tsx">
): ObfuscationResult {
  const start = performance.now();

  let jsSource: string;
  let wasTranspiled: boolean;
  try {
    const transpiled = transpileToJavaScript(sourceCode, resolvedLanguage);
    jsSource = transpiled.code;
    wasTranspiled = transpiled.wasTranspiled;
  } catch (err: any) {
    const { line, column } = parseErrorLocation(err);
    throw new ObfuscationSyntaxError(
      cleanErrorMessage(err?.message ?? "Unable to parse this code."),
      line,
      column
    );
  }

  const obfuscated = obfuscateJavaScript(jsSource, settings);
  const watermark = buildJsWatermark(settings, brandName);
  const finalCode = watermark + obfuscated;
  const elapsedMs = Math.round((performance.now() - start) * 100) / 100;

  return {
    code: finalCode,
    originalSizeBytes: byteSize(sourceCode),
    outputSizeBytes: byteSize(finalCode),
    elapsedMs,
    language: resolvedLanguage,
    wasTranspiled,
    mode: "obfuscated",
  };
}

function processHtml(
  sourceCode: string,
  settings: ObfuscationSettings,
  brandName: string
): ObfuscationResult {
  const start = performance.now();

  const { htmlWithPlaceholders, scripts } = extractInlineScripts(sourceCode);

  const obfuscatedScripts = scripts.map((script) => {
    const jsResult = processJavaScriptFamily(
      script,
      { ...settings, watermark: { ...settings.watermark, enabled: false } },
      brandName,
      "javascript"
    );
    return jsResult.code;
  });

  const reinserted = reinsertScripts(htmlWithPlaceholders, obfuscatedScripts);
  const minified = minifyHtml(reinserted);
  const watermark = buildHtmlWatermark(settings, brandName);
  const finalCode = watermark + minified;
  const elapsedMs = Math.round((performance.now() - start) * 100) / 100;

  return {
    code: finalCode,
    originalSizeBytes: byteSize(sourceCode),
    outputSizeBytes: byteSize(finalCode),
    elapsedMs,
    language: "html",
    wasTranspiled: false,
    mode: scripts.length > 0 ? "obfuscated" : "minified",
    note:
      scripts.length > 0
        ? `${scripts.length} inline <script> block${scripts.length > 1 ? "s were" : " was"} obfuscated. The rest of the HTML markup was minified -- HTML tags themselves cannot be obfuscated.`
        : "No inline JavaScript was found, so this HTML was only minified.",
  };
}

function processCss(
  sourceCode: string,
  settings: ObfuscationSettings,
  brandName: string
): ObfuscationResult {
  const start = performance.now();
  const minified = minifyCss(sourceCode);
  const watermark = buildCssWatermark(settings, brandName);
  const finalCode = watermark + minified;
  const elapsedMs = Math.round((performance.now() - start) * 100) / 100;

  return {
    code: finalCode,
    originalSizeBytes: byteSize(sourceCode),
    outputSizeBytes: byteSize(finalCode),
    elapsedMs,
    language: "css",
    wasTranspiled: false,
    mode: "minified",
    note: "CSS has no executable logic to hide, so it is minified rather than obfuscated.",
  };
}

function processJson(sourceCode: string): ObfuscationResult {
  const start = performance.now();
  let minified: string;
  try {
    minified = minifyJson(sourceCode);
  } catch (err: any) {
    throw new ObfuscationSyntaxError(err?.message ?? "Invalid JSON.");
  }
  const elapsedMs = Math.round((performance.now() - start) * 100) / 100;

  return {
    code: minified,
    originalSizeBytes: byteSize(sourceCode),
    outputSizeBytes: byteSize(minified),
    elapsedMs,
    language: "json",
    wasTranspiled: false,
    mode: "minified",
    note: "JSON is data, not code, so it is minified only. JSON also does not support comments, so no watermark is added.",
  };
}

export function runObfuscation(
  sourceCode: string,
  settings: ObfuscationSettings,
  brandName: string
): ObfuscationResult {
  const resolvedLanguage =
    settings.language === "auto" ? detectLanguage(sourceCode) : settings.language;

  switch (resolvedLanguage) {
    case "html":
      return processHtml(sourceCode, settings, brandName);
    case "css":
      return processCss(sourceCode, settings, brandName);
    case "json":
      return processJson(sourceCode);
    default:
      return processJavaScriptFamily(sourceCode, settings, brandName, resolvedLanguage);
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
