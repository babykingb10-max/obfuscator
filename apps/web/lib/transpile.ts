import { transform } from "sucrase";
import { SourceLanguage } from "./types";

/**
 * javascript-obfuscator only understands plain JavaScript. If the pasted
 * code is TypeScript and/or JSX, strip the extra syntax down to JS first so
 * obfuscation can run on it. Plain JavaScript passes through untouched.
 */
export function transpileToJavaScript(
  code: string,
  language: SourceLanguage
): { code: string; wasTranspiled: boolean } {
  if (language === "javascript") {
    return { code, wasTranspiled: false };
  }

  const transforms: ("typescript" | "jsx" | "imports")[] = [];
  if (language === "typescript" || language === "tsx") transforms.push("typescript");
  if (language === "jsx" || language === "tsx") transforms.push("jsx");

  const result = transform(code, {
    transforms,
    production: true,
    jsxRuntime: "classic",
  });

  return { code: result.code, wasTranspiled: true };
}
