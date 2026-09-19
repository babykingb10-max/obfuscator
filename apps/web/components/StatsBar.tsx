"use client";

import { ObfuscationResult } from "@/lib/types";
import { formatBytes } from "@/lib/obfuscate";
import { LANGUAGE_LABELS } from "@/lib/languageDetect";

function Stat({ label, value, valueClass = "text-slate-200" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-600">{label}</span>
      <span className={`text-sm font-mono ${valueClass}`}>{value}</span>
    </div>
  );
}

export default function StatsBar({ result }: { result: ObfuscationResult | null }) {
  if (!result) return null;

  const delta = result.outputSizeBytes - result.originalSizeBytes;
  const deltaLabel = delta >= 0 ? `+${formatBytes(delta)}` : `-${formatBytes(Math.abs(delta))}`;

  return (
    <div className="rounded-xl border border-charcoal-700 bg-charcoal-900/60 px-5 py-4 space-y-3">
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <Stat label="Original" value={formatBytes(result.originalSizeBytes)} />
        <Stat label="Output" value={formatBytes(result.outputSizeBytes)} />
        <Stat label="Delta" value={deltaLabel} valueClass="text-violet-400" />
        <Stat label="Time" value={`${result.elapsedMs} ms`} />
        <Stat label="Lang" value={LANGUAGE_LABELS[result.language]} />
        <Stat
          label="Mode"
          value={result.mode === "obfuscated" ? "Obfuscated" : "Minified"}
          valueClass={result.mode === "obfuscated" ? "text-neon-400" : "text-amber-400"}
        />
      </div>
      {(result.wasTranspiled || result.note) && (
        <p className="text-[11px] text-slate-500 font-body border-t border-charcoal-700 pt-3 leading-relaxed">
          {result.wasTranspiled &&
            `${LANGUAGE_LABELS[result.language]} was compiled to plain JavaScript before obfuscation, since the obfuscation engine only runs on JavaScript. `}
          {result.note}
        </p>
      )}
    </div>
  );
}
