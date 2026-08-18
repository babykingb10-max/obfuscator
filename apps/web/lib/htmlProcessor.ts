const SCRIPT_TAG_REGEX = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi;
const INLINE_TYPE_ALLOWLIST = /^(text\/javascript|application\/javascript|module)?$/i;

export interface ExtractedScripts {
  htmlWithPlaceholders: string;
  scripts: string[];
}

/**
 * Pulls out inline (non-src, JavaScript-type) <script> bodies and replaces
 * them with placeholders so the rest of the HTML can be minified safely.
 * Scripts that load an external file (src="...") or use a non-JS type
 * (e.g. application/json, text/template) are left untouched.
 */
export function extractInlineScripts(html: string): ExtractedScripts {
  const scripts: string[] = [];
  let index = 0;

  const htmlWithPlaceholders = html.replace(
    SCRIPT_TAG_REGEX,
    (match, attrs: string = "", content: string) => {
      if (/\bsrc\s*=/.test(attrs)) return match;

      const typeMatch = /\btype\s*=\s*["']([^"']*)["']/.exec(attrs);
      const type = typeMatch?.[1] ?? "";
      if (!INLINE_TYPE_ALLOWLIST.test(type.trim())) return match;

      if (!content.trim()) return match;

      const placeholder = `/*__ADEVOSX_SCRIPT_${index}__*/`;
      scripts.push(content);
      index += 1;
      return `<script${attrs}>${placeholder}</script>`;
    }
  );

  return { htmlWithPlaceholders, scripts };
}

export function reinsertScripts(html: string, processedScripts: string[]): string {
  let result = html;
  processedScripts.forEach((code, i) => {
    // Function replacer avoids `$&`/`$1`-style special replacement patterns
    // that obfuscated code commonly contains.
    result = result.replace(`/*__ADEVOSX_SCRIPT_${i}__*/`, () => code);
  });
  return result;
}

export function minifyHtml(html: string): string {
  return html
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, "") // strip comments, keep IE conditional comments
    .replace(/>\s+</g, "><")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}
