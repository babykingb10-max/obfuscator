"use client";

import { AlertTriangle, ShieldCheck, ShieldAlert, Info, ArrowRight } from "lucide-react";
import { SecurityAlert, StringEncoding } from "@/lib/types";

interface SecurityAnalyzerProps {
  alerts: SecurityAlert[];
  onApplyEncoding: (encoding: StringEncoding) => void;
  onEnableDomainLock: () => void;
  onEnableDeadCodeInjection: () => void;
}

const ICONS: Record<SecurityAlert["type"], typeof AlertTriangle> = {
  critical: ShieldAlert,
  warning: AlertTriangle,
  info: Info,
};

const STYLES: Record<SecurityAlert["type"], string> = {
  critical: "border-red-500/40 bg-red-500/5 text-red-300",
  warning: "border-amber-500/40 bg-amber-500/5 text-amber-300",
  info: "border-slate-500/40 bg-slate-500/5 text-slate-300",
};

const ENCODING_OPTIONS: { value: StringEncoding; label: string }[] = [
  { value: "base64", label: "Base64" },
  { value: "rc4", label: "RC4" },
  { value: "hex", label: "Hex" },
];

function QuickActionButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded border border-neon-500 text-neon-500 hover:bg-neon-500 hover:text-charcoal-950 transition-colors focus-ring"
    >
      {children}
      <ArrowRight size={12} />
    </button>
  );
}

export default function SecurityAnalyzer({
  alerts,
  onApplyEncoding,
  onEnableDomainLock,
  onEnableDeadCodeInjection,
}: SecurityAnalyzerProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 border border-charcoal-700 rounded-md px-3 py-2">
        <ShieldCheck size={16} className="text-neon-500" />
        <span>No exposed secrets detected in the pasted code.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const Icon = ICONS[alert.type];
        const wantsEncoding = alert.suggestedSettings.includes("stringArrayEncoding");
        const wantsDomainLock = alert.suggestedSettings.includes("domainLock");
        const wantsDeadCode = alert.suggestedSettings.includes("deadCodeInjection");

        return (
          <div
            key={alert.id}
            className={`border rounded-md px-3 py-2.5 ${STYLES[alert.type]}`}
          >
            <div className="flex items-start gap-2">
              <Icon size={16} className="mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm">{alert.message}</p>

                {(wantsEncoding || wantsDomainLock || wantsDeadCode) && (
                  <div className="mt-2.5 space-y-2">
                    {wantsEncoding && (
                      <div>
                        <p className="text-[11px] uppercase tracking-wide opacity-70 mb-1">
                          Encode strings and open in settings
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {ENCODING_OPTIONS.map((opt) => (
                            <QuickActionButton
                              key={opt.value}
                              onClick={() => onApplyEncoding(opt.value)}
                            >
                              {opt.label}
                            </QuickActionButton>
                          ))}
                        </div>
                      </div>
                    )}
                    {wantsDomainLock && (
                      <QuickActionButton onClick={onEnableDomainLock}>
                        Enable domain lock
                      </QuickActionButton>
                    )}
                    {wantsDeadCode && (
                      <QuickActionButton onClick={onEnableDeadCodeInjection}>
                        Enable dead code injection
                      </QuickActionButton>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
