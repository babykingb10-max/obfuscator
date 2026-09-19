"use client";

import { ObfuscationSettings } from "@/lib/types";
import { calculateProtectionScore } from "@/lib/protectionScore";

interface ProtectionMeterProps {
  settings: ObfuscationSettings;
  compact?: boolean;
}

export default function ProtectionMeter({ settings, compact = false }: ProtectionMeterProps) {
  const { score, label, color } = calculateProtectionScore(settings);

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
          Protection
        </span>
        <span className="text-xs font-medium font-mono" style={{ color }}>
          {label} &middot; {score}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-charcoal-700 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${score}%`,
            background: `linear-gradient(90deg, #6c5ce0, ${color})`,
          }}
        />
      </div>
    </div>
  );
}
