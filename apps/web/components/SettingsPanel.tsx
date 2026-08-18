"use client";

import { HelpCircle } from "lucide-react";
import { useState } from "react";
import { LEVEL_DESCRIPTIONS, applyLevelPreset, applyProjectPreset } from "@/lib/presets";
import { ObfuscationSettings, PresetLevel, ProjectPreset, StringEncoding } from "@/lib/types";

interface SettingsPanelProps {
  settings: ObfuscationSettings;
  onChange: (settings: ObfuscationSettings) => void;
}

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex ml-1.5">
      <button
        type="button"
        aria-label="Help"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow((v) => !v)}
        className="text-slate-500 hover:text-neon-500 focus-ring rounded-full"
      >
        <HelpCircle size={14} />
      </button>
      {show && (
        <span className="absolute left-1/2 -translate-x-1/2 bottom-6 w-56 text-xs bg-charcoal-700 text-slate-200 rounded-md px-3 py-2 shadow-lg z-20 border border-charcoal-600">
          {text}
        </span>
      )}
    </span>
  );
}

const LEVELS: PresetLevel[] = ["low", "medium", "high", "extreme"];
const PROJECT_PRESETS: { key: ProjectPreset; label: string }[] = [
  { key: "none", label: "None" },
  { key: "node-backend", label: "Node.js / Backend" },
  { key: "react-frontend", label: "React / Frontend" },
  { key: "bot-telegram-whatsapp", label: "Telegram / WhatsApp Bot" },
];
const STRING_ENCODINGS: StringEncoding[] = ["none", "base64", "rc4", "hex"];

export default function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const update = (patch: Partial<ObfuscationSettings>) =>
    onChange({ ...settings, ...patch });

  const showJsScopeNote = settings.language === "css" || settings.language === "json";

  return (
    <div className="space-y-8">
      {showJsScopeNote && (
        <div className="text-xs text-amber-300 bg-amber-500/5 border border-amber-500/30 rounded-md px-3 py-2">
          {settings.language === "css" ? "CSS" : "JSON"} has no executable code to obfuscate, so
          the controls below are ignored for this file -- only minification is applied. Switch
          Language back to JavaScript/TypeScript (or HTML with embedded scripts) to use these
          settings.
        </div>
      )}

      <section>
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Protection level</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => update(applyLevelPreset(settings, lvl))}
              className={`px-3 py-2 rounded-md text-sm capitalize border transition-colors focus-ring ${
                settings.level === lvl
                  ? "border-neon-500 text-neon-500 bg-charcoal-800 shadow-neon"
                  : "border-charcoal-600 text-slate-300 hover:border-charcoal-500"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">{LEVEL_DESCRIPTIONS[settings.level]}</p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Project preset</h3>
        <select
          value={settings.projectPreset}
          onChange={(e) => update(applyProjectPreset(settings, e.target.value as ProjectPreset))}
          className="w-full bg-charcoal-800 border border-charcoal-600 rounded-md px-3 py-2 text-sm text-slate-200 focus-ring"
        >
          {PROJECT_PRESETS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-2">
          One-click tuning for common project types. You can still fine-tune every
          control below afterward.
        </p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Granular controls</h3>
        <div className="space-y-4">
          <div>
            <label className="flex items-center text-sm text-slate-300 mb-1">
              String array encoding
              <Tooltip text="Encodes string literals and moves them into an array so they are not readable as plain text." />
            </label>
            <select
              value={settings.stringArrayEncoding}
              onChange={(e) =>
                update({
                  stringArrayEncoding: e.target.value as StringEncoding,
                  level: "custom",
                })
              }
              className="w-full bg-charcoal-800 border border-charcoal-600 rounded-md px-3 py-2 text-sm text-slate-200 focus-ring"
            >
              {STRING_ENCODINGS.map((enc) => (
                <option key={enc} value={enc}>
                  {enc === "none" ? "Disabled" : enc.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <ToggleRow
            label="Control flow flattening"
            tooltip="Rewrites logic into a flattened dispatch structure. Strong protection, noticeably slower execution."
            checked={settings.controlFlowFlattening}
            onChange={(v) => update({ controlFlowFlattening: v, level: "custom" })}
          />

          <ToggleRow
            label="Dead code injection"
            tooltip="Inserts non-functional filler code to confuse readers. Increases output size."
            checked={settings.deadCodeInjection}
            onChange={(v) => update({ deadCodeInjection: v, level: "custom" })}
          />

          {settings.deadCodeInjection && (
            <RangeRow
              label="Dead code amount"
              value={settings.deadCodeInjectionThreshold}
              onChange={(v) => update({ deadCodeInjectionThreshold: v, level: "custom" })}
            />
          )}

          <ToggleRow
            label="Rename identifiers"
            tooltip="Replaces variable and function names with meaningless hexadecimal identifiers."
            checked={settings.renameIdentifiers}
            onChange={(v) => update({ renameIdentifiers: v, level: "custom" })}
          />

          <ToggleRow
            label="Compact output"
            tooltip="Removes whitespace and line breaks to minimize file size."
            checked={settings.compact}
            onChange={(v) => update({ compact: v, level: "custom" })}
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Runtime locks</h3>
        <div className="space-y-4">
          <ToggleRow
            label="Domain lock"
            tooltip="The code refuses to run unless the page's hostname matches one of the domains you list."
            checked={settings.locks.domainLockEnabled}
            onChange={(v) =>
              update({ locks: { ...settings.locks, domainLockEnabled: v } })
            }
          />
          {settings.locks.domainLockEnabled && (
            <input
              type="text"
              placeholder="example.com, app.example.com"
              value={settings.locks.domains}
              onChange={(e) =>
                update({ locks: { ...settings.locks, domains: e.target.value } })
              }
              className="w-full bg-charcoal-800 border border-charcoal-600 rounded-md px-3 py-2 text-sm text-slate-200 focus-ring"
            />
          )}

          <ToggleRow
            label="Disable console output"
            tooltip="Silently disables console.log and related calls so the output cannot be inspected that way."
            checked={settings.locks.disableConsoleOutput}
            onChange={(v) =>
              update({ locks: { ...settings.locks, disableConsoleOutput: v } })
            }
          />

          <ToggleRow
            label="Self-defending"
            tooltip="The code breaks itself if someone tries to reformat or beautify it."
            checked={settings.locks.selfDefending}
            onChange={(v) =>
              update({ locks: { ...settings.locks, selfDefending: v } })
            }
          />

          <ToggleRow
            label="Anti-debugging"
            tooltip="Repeatedly checks for an open browser DevTools session and interrupts execution if one is detected."
            checked={settings.locks.debugProtection}
            onChange={(v) =>
              update({ locks: { ...settings.locks, debugProtection: v } })
            }
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Time bomb (expiration date)</h3>
        <ToggleRow
          label="Enable expiry date"
          tooltip="The code stops running after the date you set below. Useful for trial builds."
          checked={settings.expiry.enabled}
          onChange={(v) => update({ expiry: { ...settings.expiry, enabled: v } })}
        />
        {settings.expiry.enabled && (
          <div className="mt-3 space-y-3">
            <input
              type="date"
              value={settings.expiry.expiryDate}
              onChange={(e) =>
                update({ expiry: { ...settings.expiry, expiryDate: e.target.value } })
              }
              className="w-full bg-charcoal-800 border border-charcoal-600 rounded-md px-3 py-2 text-sm text-slate-200 focus-ring"
            />
            <input
              type="text"
              placeholder="Message shown after expiry"
              value={settings.expiry.expiredMessage}
              onChange={(e) =>
                update({
                  expiry: { ...settings.expiry, expiredMessage: e.target.value },
                })
              }
              className="w-full bg-charcoal-800 border border-charcoal-600 rounded-md px-3 py-2 text-sm text-slate-200 focus-ring"
            />
          </div>
        )}
      </section>
    </div>
  );
}

function ToggleRow({
  label,
  tooltip,
  checked,
  onChange,
}: {
  label: string;
  tooltip?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center text-sm text-slate-300">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors focus-ring ${
          checked ? "bg-neon-600" : "bg-charcoal-600"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-charcoal-950 transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function RangeRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm text-slate-300 mb-1">
        <span>{label}</span>
        <span className="text-neon-500">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-neon-500"
      />
    </div>
  );
}
