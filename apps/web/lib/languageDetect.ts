import { SourceLanguage } from "./types";

export const LANGUAGE_LABELS: Record<SourceLanguage, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  jsx: "JSX (React)",
  tsx: "TSX (React + TypeScript)",
  html: "HTML",
  css: "CSS",
  json: "JSON",
};

// Only javascript/typescript/jsx/tsx can be genuinely obfuscated (they run as
// code). html gets its inline <script> obfuscated and the rest minified.
// css and json have no executable logic to hide, so they are minified only.
export const OBFUSCATABLE_LANGUAGES: SourceLanguage[] = [
  "javascript",
  "typescript",
  "jsx",
  "tsx",
];

const EXTENSION_MAP: Record<string, SourceLanguage> = {
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  jsx: "jsx",
  tsx: "tsx",
  html: "html",
  htm: "html",
  css: "css",
  json: "json",
};

export function detectLanguageFromFileName(fileName: string): SourceLanguage | null {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  return EXTENSION_MAP[ext] ?? null;
}

const TS_PATTERNS: RegExp[] = [
  /\bimport\s+type\b/,
  /\bexport\s+type\b/,
  /\binterface\s+\w+/,
  /\benum\s+\w+\s*\{/,
  /\bas\s+const\b/,
  /\bas\s+[A-Z]\w*/,
  /\breadonly\s+\w+/,
  /\b(public|private|protected)\s+(readonly\s+)?\w+/,
  /:\s*(string|number|boolean|any|unknown|never|void|object)\b/,
  /\)\s*:\s*[A-Za-z_][\w<>\[\].]*\s*(\{|=>)/,
  /<\w+>\s*\(/,
  /\w+\?\s*:\s*\w/,
];

const JSX_PATTERNS: RegExp[] = [
  /<[A-Za-z][\w.]*(\s[^<>]*)?\/?>/,
  /<>[\s\S]*?<\/>/,
  /<\/[A-Za-z][\w.]*>/,
];

function looksLikeHtml(code: string): boolean {
  const trimmed = code.trim();
  return (
    /^<!doctype html/i.test(trimmed) ||
    /<html[\s>]/i.test(trimmed) ||
    (/<head[\s>]/i.test(trimmed) && /<body[\s>]/i.test(trimmed))
  );
}

function looksLikeJson(code: string): boolean {
  const trimmed = code.trim();
  if (!trimmed) return false;
  if (!/^[{[]/.test(trimmed) || !/[}\]]$/.test(trimmed)) return false;
  // Reject obvious JS: object/array literals used inside code (assignments,
  // function calls, keywords) shouldn't be misread as a JSON document.
  if (/\b(function|const|let|var|import|export|=>|class)\b/.test(trimmed)) return false;
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

function looksLikeCss(code: string): boolean {
  const trimmed = code.trim();
  if (!trimmed) return false;
  if (/\b(function|const|let|var|import|export|=>|<[a-zA-Z]|class\s+\w+\s*\{)\b/.test(trimmed)) {
    return false;
  }
  // A handful of "selector { property: value; }" blocks is a strong signal.
  const ruleMatches = trimmed.match(/[^{}]+\{[^{}]*\}/g) ?? [];
  const declarationLike = /[\w-]+\s*:\s*[^;{}]+;?/;
  const hitRate = ruleMatches.filter((rule) => declarationLike.test(rule)).length;
  return ruleMatches.length > 0 && hitRate / ruleMatches.length > 0.5;
}

export function detectLanguage(code: string, fileName?: string): SourceLanguage {
  if (fileName) {
    const fromExtension = detectLanguageFromFileName(fileName);
    if (fromExtension) return fromExtension;
  }

  if (!code || !code.trim()) return "javascript";

  if (looksLikeHtml(code)) return "html";
  if (looksLikeJson(code)) return "json";
  if (looksLikeCss(code)) return "css";

  const looksLikeTS = TS_PATTERNS.some((re) => re.test(code));
  const looksLikeJSX = JSX_PATTERNS.some((re) => re.test(code));

  if (looksLikeTS && looksLikeJSX) return "tsx";
  if (looksLikeTS) return "typescript";
  if (looksLikeJSX) return "jsx";
  return "javascript";
}
