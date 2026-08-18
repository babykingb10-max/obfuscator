"use client";

import { ShieldAlert } from "lucide-react";
import { SecurityAlert, StringEncoding } from "@/lib/types";

interface SecretGuardModalProps {
  alerts: SecurityAlert[];
  onApplyEncoding: (encoding: StringEncoding) => void;
  onObfuscateAnyway: () => void;
  onCancel: () => void;
}

const ENCODING_OPTIONS: { value: StringEncoding; label: string }[] = [
  { value: "base64", label: "Base64" },
  { value: "rc4", label: "RC4" },
  { value: "hex", label: "Hex" },
];

export default function SecretGuardModal({
  alerts,
  onApplyEncoding,
  onObfuscateAnyway,
  onCancel,
}: SecretGuardModalProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />

      <div className="relative w-full max-w-md bg-charcoal-900 border border-red-500/40 rounded-md shadow-lg p-5 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldAlert size={20} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              This code contains what looks like exposed secrets
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {alerts.length === 1
                ? alerts[0].message
                : `${alerts.length} issues were found, including hard-coded keys or tokens.`}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-2">
            Encode strings before obfuscating (recommended):
          </p>
          <div className="flex flex-wrap gap-2">
            {ENCODING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onApplyEncoding(opt.value)}
                className="px-3 py-1.5 rounded-md text-xs font-medium border border-neon-500 text-neon-500 hover:bg-neon-500 hover:text-charcoal-950 transition-colors focus-ring"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-charcoal-700">
          <button
            onClick={onObfuscateAnyway}
            className="flex-1 px-3 py-2 rounded-md text-sm border border-charcoal-600 text-slate-200 hover:border-slate-400 transition-colors focus-ring"
          >
            Obfuscate anyway
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2 rounded-md text-sm text-slate-400 hover:text-slate-200 transition-colors focus-ring"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
