"use client";

import { ShieldCheck, Globe2, Zap, Download } from "lucide-react";

const BADGES = [
  { icon: ShieldCheck, label: "100% client-side" },
  { icon: Globe2, label: "7 languages" },
  { icon: Zap, label: "No signup" },
  { icon: Download, label: "Installable PWA" },
];

export default function TrustBadges() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
      {BADGES.map(({ icon: Icon, label }) => (
        <span key={label} className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
          <Icon size={12} className="text-neon-500" />
          {label}
        </span>
      ))}
    </div>
  );
}
