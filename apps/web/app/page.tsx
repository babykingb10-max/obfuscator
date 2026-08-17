"use client";

import { useEffect, useMemo, useState } from "react";
import { ScanSearch, Wand2, Trash2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import CodeEditorPanel from "@/components/CodeEditorPanel";
import SettingsPanel from "@/components/SettingsPanel";
import WatermarkSettings from "@/components/WatermarkSettings";
import SecurityAnalyzer from "@/components/SecurityAnalyzer";
import StatsBar from "@/components/StatsBar";
import Toast, { ToastMessage } from "@/components/Toast";
import { DEFAULT_SETTINGS } from "@/lib/presets";
import { ObfuscationSyntaxError, runObfuscation } from "@/lib/obfuscate";
import { analyzeSourceForSecrets } from "@/lib/securityScanner";
import { ObfuscationResult, ObfuscationSettings, SecurityAlert } from "@/lib/types";
import { VaultEntry, deleteVaultEntry, getVaultEntries, saveVaultEntry } from "@/lib/vault";
import { getSavedWatermarkPrefs } from "@/lib/watermarkPrefs";

const SAMPLE_CODE = `function greet(name) {
  const apiKey = "sk_live_51NxSampleKeyDoNotUse";
  console.log("Hello, " + name);
  return apiKey;
}

greet("world");
`;

const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || "Adevos-X Tech";

type View = "obfuscator" | "settings" | "history" | "about";

export default function Home() {
  const [view, setView] = useState<View>("obfuscator");
  const [sourceCode, setSourceCode] = useState(SAMPLE_CODE);
  const [settings, setSettings] = useState<ObfuscationSettings>(DEFAULT_SETTINGS);
  const [result, setResult] = useState<ObfuscationResult | null>(null);
  const [scanned, setScanned] = useState(false);
  const [vaultEntries, setVaultEntries] = useState<VaultEntry[]>([]);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    setVaultEntries(getVaultEntries());
    const savedWatermark = getSavedWatermarkPrefs();
    if (savedWatermark) {
      setSettings((prev) => ({ ...prev, watermark: savedWatermark }));
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.type === "error" ? 8000 : 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const alerts: SecurityAlert[] = useMemo(
    () => (scanned ? analyzeSourceForSecrets(sourceCode) : []),
    [scanned, sourceCode]
  );

  const handleObfuscate = () => {
    if (!sourceCode.trim()) {
      setToast({
        type: "warning",
        title: "No code to obfuscate",
        description: "Paste or upload your JavaScript code in the Input panel first.",
      });
      return;
    }

    try {
      const res = runObfuscation(sourceCode, settings, BRAND_NAME);
      setResult(res);
      setToast({ type: "success", title: "Code obfuscated successfully." });
    } catch (err) {
      if (err instanceof ObfuscationSyntaxError) {
        setToast({
          type: "error",
          title: err.line
            ? `Syntax error on line ${err.line}${err.column ? `, column ${err.column}` : ""}`
            : "Syntax error in your code",
          description: `${err.message}. Please fix your code before obfuscating.`,
        });
      } else {
        setToast({
          type: "error",
          title: "Could not obfuscate this code",
          description:
            "Something unexpected went wrong while processing your code. Double-check it for mistakes and try again.",
        });
      }
    }
  };

  const handleScan = () => {
    if (!sourceCode.trim()) {
      setToast({
        type: "warning",
        title: "No code to scan",
        description: "Paste or upload your JavaScript code in the Input panel first.",
      });
      return;
    }
    setScanned(true);
    setToast({ type: "info", title: "Scan complete." });
  };

  const handleFixAutomatically = (alert: SecurityAlert) => {
    let next = { ...settings, level: "custom" as const };
    if (alert.suggestedSettings.includes("stringArrayEncoding")) {
      next = { ...next, stringArrayEncoding: "rc4" };
    }
    if (alert.suggestedSettings.includes("domainLock")) {
      next = { ...next, locks: { ...next.locks, domainLockEnabled: true } };
    }
    if (alert.suggestedSettings.includes("deadCodeInjection")) {
      next = { ...next, deadCodeInjection: true };
    }
    setSettings(next);
  };

  const handleUploadInput = (content: string) => {
    setSourceCode(content);
    setResult(null);
    setScanned(false);
  };

  const handleClearInput = () => {
    setSourceCode("");
    setScanned(false);
  };

  const handleClearOutput = () => {
    setResult(null);
  };

  const handleSaveSnippet = () => {
    if (!sourceCode.trim()) return;
    saveVaultEntry(sourceCode, settings);
    setVaultEntries(getVaultEntries());
  };

  const handleDeleteAll = () => {
    setSourceCode("");
    setResult(null);
    setScanned(false);
    setSettings(DEFAULT_SETTINGS);
  };

  const handleLoadVaultEntry = (entry: VaultEntry) => {
    setSourceCode(entry.sourceCode);
    setSettings(entry.settings);
    setResult(null);
    setScanned(false);
    setView("obfuscator");
  };

  const handleDeleteVaultEntry = (id: string) => {
    setVaultEntries(deleteVaultEntry(id));
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <Sidebar activeView={view} onNavigate={setView} />

      <main className="flex-1 min-w-0 p-4 lg:p-8 space-y-6">
        {view === "obfuscator" && (
          <>
            <header>
              <h1 className="font-display text-xl lg:text-2xl text-slate-100">
                Obfuscate JavaScript
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Everything runs in your browser. Your source code is never uploaded to a server.
              </p>
            </header>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleScan}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm border border-charcoal-600 text-slate-200 hover:border-neon-500 hover:text-neon-500 transition-colors focus-ring"
              >
                <ScanSearch size={16} />
                Scan code
              </button>
              <button
                onClick={handleObfuscate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm bg-neon-500 text-charcoal-950 font-medium hover:bg-neon-400 transition-colors focus-ring"
              >
                <Wand2 size={16} />
                Obfuscate
              </button>
              <button
                onClick={handleDeleteAll}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm border border-charcoal-600 text-slate-300 hover:border-red-500 hover:text-red-400 transition-colors focus-ring"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>

            {scanned && (
              <SecurityAnalyzer alerts={alerts} onFixAutomatically={handleFixAutomatically} />
            )}

            <div className="grid lg:grid-cols-2 gap-4 h-[420px]">
              <CodeEditorPanel
                title="Input"
                value={sourceCode}
                onChange={setSourceCode}
                onUpload={handleUploadInput}
                onClear={handleClearInput}
              />
              <CodeEditorPanel
                title="Output"
                value={result?.code ?? "// Obfuscated code will appear here"}
                readOnly
                downloadFileName="obfuscated.js"
                onClear={handleClearOutput}
              />
            </div>

            <StatsBar result={result} />
          </>
        )}

        {view === "settings" && (
          <>
            <header>
              <h1 className="font-display text-xl lg:text-2xl text-slate-100">
                Advanced settings
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Fine-tune every part of the obfuscation pipeline.
              </p>
            </header>
            <div className="max-w-2xl space-y-6">
              <SettingsPanel settings={settings} onChange={setSettings} />
              <WatermarkSettings
                settings={settings}
                onChange={setSettings}
                brandName={BRAND_NAME}
                onSaveSnippet={handleSaveSnippet}
              />
            </div>
          </>
        )}

        {view === "history" && (
          <>
            <header>
              <h1 className="font-display text-xl lg:text-2xl text-slate-100">
                Obfuscation vault
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Saved snippets and settings are stored locally in this browser. Source code is
                never sent to a server for this feature.
              </p>
            </header>

            {vaultEntries.length === 0 ? (
              <div className="border border-dashed border-charcoal-700 rounded-md px-6 py-10 text-center text-sm text-slate-500">
                Nothing saved yet. Open Advanced Settings, enable the watermark, and use the
                Save button there to add an entry here.
              </div>
            ) : (
              <div className="space-y-2 max-w-2xl">
                {vaultEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-3 border border-charcoal-700 rounded-md px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 truncate">{entry.label}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleLoadVaultEntry(entry)}
                        className="text-xs px-2.5 py-1 rounded border border-neon-500 text-neon-500 hover:bg-neon-500 hover:text-charcoal-950 transition-colors focus-ring"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeleteVaultEntry(entry.id)}
                        aria-label="Delete saved entry"
                        className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-charcoal-800 focus-ring"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {view === "about" && (
          <>
            <header>
              <h1 className="font-display text-xl lg:text-2xl text-slate-100">
                About {BRAND_NAME}
              </h1>
            </header>
            <div className="max-w-2xl space-y-4 text-sm text-slate-400 leading-relaxed">
              <p>
                {BRAND_NAME} Obfuscator is a client-side JavaScript protection tool. Obfuscation,
                including string encoding, control flow flattening, and dead code injection, runs
                entirely inside your browser. Nothing is uploaded to a server unless you choose to
                save settings to an account.
              </p>
              <p>
                The security analyzer is a regex-based scanner that also runs locally, checking for
                common leaks such as database URIs, bot tokens, and hard-coded API keys before you
                share your code.
              </p>
              <p>
                Remember to keep a safe copy of your original source. Obfuscation is one-directional
                and cannot be reversed by this tool.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
