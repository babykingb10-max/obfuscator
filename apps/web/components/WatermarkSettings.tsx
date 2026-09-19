"use client";

import { useState } from "react";
import { Save, Check } from "lucide-react";
import { ObfuscationSettings } from "@/lib/types";
import { saveWatermarkPrefs } from "@/lib/watermarkPrefs";

interface WatermarkSettingsProps {
  settings: ObfuscationSettings;
  onChange: (settings: ObfuscationSettings) => void;
  brandName: string;
  onSaveSnippet?: () => void;
}

export default function WatermarkSettings({
  settings,
  onChange,
  brandName,
  onSaveSnippet,
}: WatermarkSettingsProps) {
  const watermark = settings.watermark;
  const [saved, setSaved] = useState(false);

  const preview = watermark.enabled
    ? watermark.useCustomName && watermark.customName.trim()
      ? `// Obfuscated by ${watermark.customName.trim()} | Powered by ${brandName}`
      : `// Obfuscated & secured by ${brandName}`
    : "// No header added";

  const handleSave = () => {
    saveWatermarkPrefs(watermark);
    onSaveSnippet?.();
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <section className="border border-charcoal-700 rounded-xl p-4 space-y-4 bg-charcoal-900/40">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-display font-semibold text-slate-100">Custom header / watermark</h3>
        <button
          role="switch"
          aria-checked={watermark.enabled}
          onClick={() =>
            onChange({ ...settings, watermark: { ...watermark, enabled: !watermark.enabled } })
          }
          className={`relative w-10 h-6 rounded-full transition-colors focus-ring ${
            watermark.enabled ? "bg-neon-600" : "bg-charcoal-600"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-charcoal-950 transition-transform ${
              watermark.enabled ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {watermark.enabled && (
        <>
          <div className="flex gap-2">
            <button
              onClick={() =>
                onChange({ ...settings, watermark: { ...watermark, useCustomName: false } })
              }
              className={`px-3 py-1.5 text-xs rounded-lg border focus-ring transition-colors ${
                !watermark.useCustomName
                  ? "border-neon-500 text-neon-400"
                  : "border-charcoal-600 text-slate-400 hover:border-charcoal-500"
              }`}
            >
              Default branding
            </button>
            <button
              onClick={() =>
                onChange({ ...settings, watermark: { ...watermark, useCustomName: true } })
              }
              className={`px-3 py-1.5 text-xs rounded-lg border focus-ring transition-colors ${
                watermark.useCustomName
                  ? "border-neon-500 text-neon-400"
                  : "border-charcoal-600 text-slate-400 hover:border-charcoal-500"
              }`}
            >
              Custom name
            </button>
          </div>

          {watermark.useCustomName && (
            <input
              type="text"
              placeholder="Your name or handle"
              value={watermark.customName}
              onChange={(e) =>
                onChange({
                  ...settings,
                  watermark: { ...watermark, customName: e.target.value },
                })
              }
              className="w-full bg-charcoal-800 border border-charcoal-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus-ring"
            />
          )}

          <p className="text-xs text-violet-300/80 font-mono bg-charcoal-950 rounded-lg px-3 py-2 border border-charcoal-700">
            {preview}
          </p>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border border-charcoal-600 text-slate-200 hover:border-neon-500 hover:text-neon-400 transition-colors focus-ring"
            >
              {saved ? <Check size={14} /> : <Save size={14} />}
              {saved ? "Saved" : "Save"}
            </button>
            <span className="text-xs text-slate-500">
              Remembers this header and saves the current code to your Vault.
            </span>
          </div>
        </>
      )}
    </section>
  );
}
