"use client";

import { ObfuscationResult } from "@/lib/types";
import { formatBytes } from "@/lib/obfuscate";
import { LANGUAGE_LABELS } from "@/lib/languageDetect";

export default function StatsBar({ result }: { result: ObfuscationResult | null }) {
  if (!result) return null;

  const delta = result.outputSizeBytes - result.originalSizeBytes;
  const deltaLabel = delta >= 0 ? `+${formatBytes(delta)}` : `-${formatBytes(Math.abs(delta))}`;

  return (
    <div className="border border-charcoal-700 rounded-md px-4 py-3 space-y-1.5">
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
        <span>
          Original: <span className="text-slate-200">{formatBytes(result.originalSizeBytes)}</span>
        </span>
        <span>
          Output: <span className="text-slate-200">{formatBytes(result.outputSizeBytes)}</span>
        </span>
        <span>
          Size change: <span className="text-neon-500">{deltaLabel}</span>
        </span>
        <span>
          Time: <span className="text-slate-200">{result.elapsedMs} ms</span>
        </span>
        <span>
          Lang: <span className="text-slate-200">{LANGUAGE_LABELS[result.language]}</span>
        </span>
        <span>
          Mode:{" "}
          <span className={result.mode === "obfuscated" ? "text-neon-500" : "text-amber-400"}>
            {result.mode === "obfuscated" ? "Obfuscated" : "Minified"}
          </span>
        </span>
      </div>
      {(result.wasTranspiled || result.note) && (
        <p className="text-[11px] text-slate-500">
          {result.wasTranspiled &&
            `${LANGUAGE_LABELS[result.language]} was compiled to plain JavaScript before obfuscation, since the obfuscation engine only runs on JavaScript. `}
          {result.note}
        </p>
      )}
    </div>
  );
}
