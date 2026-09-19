"use client";

import { useEffect, useMemo, useState } from "react";
import { ScanSearch, Wand2, Trash2, Sparkles, Pencil, Check, ShieldCheck, Cpu, Lock, HelpCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import CodeEditorPanel from "@/components/CodeEditorPanel";
import SettingsPanel from "@/components/SettingsPanel";
import WatermarkSettings from "@/components/WatermarkSettings";
import SecurityAnalyzer from "@/components/SecurityAnalyzer";
import SecretGuardModal from "@/components/SecretGuardModal";
import StatsBar from "@/components/StatsBar";
import Toast, { ToastMessage } from "@/components/Toast";
import Footer from "@/components/Footer";
import TrustBadges from "@/components/TrustBadges";
import { DEFAULT_SETTINGS } from "@/lib/presets";
import { ObfuscationSyntaxError, runObfuscation } from "@/lib/obfuscate";
import { analyzeSourceForSecrets } from "@/lib/securityScanner";
import { detectLanguage, detectLanguageFromFileName, LANGUAGE_LABELS } from "@/lib/languageDetect";
import { CODE_EXAMPLES } from "@/lib/examples";
import ProtectionMeter from "@/components/ProtectionMeter";
import BatchObfuscator from "@/components/BatchObfuscator";
import {
  LanguageSetting,
  ObfuscationResult,
  ObfuscationSettings,
  SecurityAlert,
  StringEncoding,
} from "@/lib/types";
import {
  VaultEntry,
  deleteVaultEntry,
  getVaultEntries,
  renameVaultEntry,
  saveVaultEntry,
} from "@/lib/vault";
import { getSavedWatermarkPrefs } from "@/lib/watermarkPrefs";

const SAMPLE_CODE = `function greet(name) {
  const apiKey = "sk_live_51NxSampleKeyDoNotUse";
  console.log("Hello, " + name);
  return apiKey;
}

greet("world");
`;

const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || "Adevos-X Tech";
const EXT_FOR_LANGUAGE: Record<string, string> = {
  javascript: "js",
  typescript: "js",
  jsx: "js",
  tsx: "js",
  html: "html",
  css: "css",
  json: "json",
};

type View = "obfuscator" | "batch" | "settings" | "history" | "about";

function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="max-w-2xl">
      <p className="text-[11px] font-mono text-violet-400 tracking-wide">{eyebrow}</p>
      <h1 className="font-display text-2xl text-slate-100 mt-1">{title}</h1>
      <p className="text-sm text-slate-500 mt-2 leading-relaxed">{description}</p>
    </header>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("obfuscator");
  const [sourceCode, setSourceCode] = useState(SAMPLE_CODE);
  const [settings, setSettings] = useState<ObfuscationSettings>(DEFAULT_SETTINGS);
  const [result, setResult] = useState<ObfuscationResult | null>(null);
  const [scanned, setScanned] = useState(false);
  const [vaultEntries, setVaultEntries] = useState<VaultEntry[]>([]);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [pendingSecretAlerts, setPendingSecretAlerts] = useState<SecurityAlert[]>([]);

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

  // Keyboard shortcut: Ctrl/Cmd+Enter triggers Obfuscate from anywhere on the
  // Obfuscator view, including while focused inside the code editor.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && view === "obfuscator") {
        e.preventDefault();
        handleObfuscate();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, sourceCode, settings]);

  const alerts: SecurityAlert[] = useMemo(
    () => (scanned ? analyzeSourceForSecrets(sourceCode) : []),
    [scanned, sourceCode]
  );

  const resolvedLanguage = useMemo(
    () => (settings.language === "auto" ? detectLanguage(sourceCode) : settings.language),
    [settings.language, sourceCode]
  );

  const monacoLanguage: string = (() => {
    switch (resolvedLanguage) {
      case "typescript":
      case "tsx":
        return "typescript";
      case "html":
        return "html";
      case "css":
        return "css";
      case "json":
        return "json";
      default:
        return "javascript";
    }
  })();

  // Success toast wording depends on whether this language could actually be
  // obfuscated (javascript/typescript/jsx/tsx) or was only minified (html
  // shell/css/json), so the user isn't told something was "obfuscated" when
  // it was really just compacted.
  const performObfuscate = (settingsOverride?: ObfuscationSettings) => {
    try {
      const res = runObfuscation(sourceCode, settingsOverride ?? settings, BRAND_NAME);
      setResult(res);
      setToast({
        type: "success",
        title:
          res.mode === "obfuscated"
            ? "Code obfuscated successfully."
            : `${LANGUAGE_LABELS[res.language]} processed (minified) successfully.`,
      });
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

  const handleObfuscate = () => {
    if (!sourceCode.trim()) {
      setToast({
        type: "warning",
        title: "No code to obfuscate",
        description: "Paste or upload your JavaScript code in the Input panel first.",
      });
      return;
    }

    // Check for hard-coded secrets before running -- if any critical ones are
    // found, ask the user how to proceed instead of silently obfuscating.
    const freshAlerts = analyzeSourceForSecrets(sourceCode);
    const criticalAlerts = freshAlerts.filter((a) => a.type === "critical");
    if (criticalAlerts.length > 0) {
      setPendingSecretAlerts(criticalAlerts);
      return;
    }

    performObfuscate();
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

  // Used by the inline Security Analyzer under "Scan code" -- applies the
  // setting and takes the user straight to Advanced Settings to confirm it.
  const handleApplyEncodingFromAnalyzer = (encoding: StringEncoding) => {
    setSettings((prev) => ({ ...prev, stringArrayEncoding: encoding, level: "custom" }));
    setView("settings");
  };

  const handleEnableDomainLockFromAnalyzer = () => {
    setSettings((prev) => ({
      ...prev,
      level: "custom",
      locks: { ...prev.locks, domainLockEnabled: true },
    }));
    setView("settings");
  };

  const handleEnableDeadCodeFromAnalyzer = () => {
    setSettings((prev) => ({ ...prev, deadCodeInjection: true, level: "custom" }));
    setView("settings");
  };

  // Used by the "detected secrets" modal shown right before obfuscating.
  const handleApplyEncodingFromGuard = (encoding: StringEncoding) => {
    const next: ObfuscationSettings = {
      ...settings,
      stringArrayEncoding: encoding,
      level: "custom",
    };
    setSettings(next);
    setPendingSecretAlerts([]);
    performObfuscate(next);
  };

  const handleObfuscateAnyway = () => {
    setPendingSecretAlerts([]);
    performObfuscate();
  };

  const handleCancelObfuscate = () => {
    setPendingSecretAlerts([]);
  };

  const handleUploadInput = (content: string, fileName: string) => {
    setSourceCode(content);
    setResult(null);
    setScanned(false);
    const fromExtension = detectLanguageFromFileName(fileName);
    if (fromExtension) {
      setSettings((prev) => ({ ...prev, language: fromExtension }));
    }
  };

  const handleClearInput = () => {
    setSourceCode("");
    setScanned(false);
  };

  const handleClearOutput = () => {
    setResult(null);
  };

  const handleLoadExample = (id: string) => {
    const example = CODE_EXAMPLES.find((e) => e.id === id);
    if (!example) return;
    setSourceCode(example.code);
    setSettings((prev) => ({ ...prev, language: example.language }));
    setResult(null);
    setScanned(false);
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

  const [editingVaultId, setEditingVaultId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  const handleStartRename = (entry: VaultEntry) => {
    setEditingVaultId(entry.id);
    setEditingLabel(entry.label);
  };

  const handleCommitRename = (id: string) => {
    setVaultEntries(renameVaultEntry(id, editingLabel));
    setEditingVaultId(null);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Toast toast={toast} onClose={() => setToast(null)} />
      {pendingSecretAlerts.length > 0 && (
        <SecretGuardModal
          alerts={pendingSecretAlerts}
          onApplyEncoding={handleApplyEncodingFromGuard}
          onObfuscateAnyway={handleObfuscateAnyway}
          onCancel={handleCancelObfuscate}
        />
      )}
      <Sidebar activeView={view} onNavigate={setView} vaultCount={vaultEntries.length} />

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10 space-y-7 max-w-6xl">
        {view === "obfuscator" && (
          <>
            <div className="boot-in space-y-3">
              <PageHeader
                eyebrow="// client-side code protection"
                title="Obfuscate your code"
                description="JavaScript, TypeScript, JSX and TSX are obfuscated. HTML has its inline scripts obfuscated and the rest minified. CSS and JSON are minified. Nothing leaves your browser."
              />
              <TrustBadges />
            </div>

            {/* Command bar */}
            <div className="rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-3 sm:p-4 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleScan}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-charcoal-600 text-slate-200 hover:border-violet-500 hover:text-violet-300 transition-colors focus-ring"
                >
                  <ScanSearch size={16} />
                  Scan
                </button>
                <button
                  onClick={handleObfuscate}
                  title="Shortcut: Ctrl/Cmd + Enter"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-neon-500 text-charcoal-950 font-medium hover:bg-neon-400 transition-colors focus-ring shadow-neon"
                >
                  <Wand2 size={16} />
                  Obfuscate
                </button>
                <button
                  onClick={handleDeleteAll}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-charcoal-600 text-slate-400 hover:border-red-500/60 hover:text-red-400 transition-colors focus-ring"
                >
                  <Trash2 size={16} />
                  Reset
                </button>

                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-violet-400 shrink-0" />
                    <select
                      id="example-select"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleLoadExample(e.target.value);
                      }}
                      className="bg-charcoal-800 border border-charcoal-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus-ring"
                    >
                      <option value="">Load example&hellip;</option>
                      {CODE_EXAMPLES.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <select
                    id="language-select"
                    value={settings.language}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        language: e.target.value as LanguageSetting,
                      }))
                    }
                    className="bg-charcoal-800 border border-charcoal-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus-ring"
                  >
                    <option value="auto">Auto &middot; {LANGUAGE_LABELS[resolvedLanguage]}</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="jsx">JSX (React)</option>
                    <option value="tsx">TSX (React + TypeScript)</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
              </div>

              <div className="max-w-xs pt-3 border-t border-charcoal-800">
                <ProtectionMeter settings={settings} compact />
              </div>
            </div>

            {scanned && (
              <SecurityAnalyzer
                alerts={alerts}
                onApplyEncoding={handleApplyEncodingFromAnalyzer}
                onEnableDomainLock={handleEnableDomainLockFromAnalyzer}
                onEnableDeadCodeInjection={handleEnableDeadCodeFromAnalyzer}
              />
            )}

            <div className="grid lg:grid-cols-2 gap-4 h-[440px]">
              <CodeEditorPanel
                title="Input"
                fileLabel={`input.${EXT_FOR_LANGUAGE[resolvedLanguage] ?? "js"}`}
                value={sourceCode}
                onChange={setSourceCode}
                onUpload={handleUploadInput}
                onClear={handleClearInput}
                language={monacoLanguage}
                accentClass="bg-violet-400"
              />
              <CodeEditorPanel
                title="Output"
                fileLabel={
                  result
                    ? `output.${EXT_FOR_LANGUAGE[result.language] ?? "js"}`
                    : "output"
                }
                value={result?.code ?? "// Obfuscated code will appear here"}
                readOnly
                downloadFileName={`obfuscated.${
                  result ? EXT_FOR_LANGUAGE[result.language] ?? "js" : "js"
                }`}
                onClear={handleClearOutput}
                language={result ? monacoLanguage : "javascript"}
                accentClass="bg-neon-400"
              />
            </div>

            <StatsBar result={result} />
          </>
        )}

        {view === "batch" && (
          <>
            <PageHeader
              eyebrow="// multi-file pipeline"
              title="Batch obfuscation"
              description="Process multiple files at once using your current Advanced Settings, then download everything as a single ZIP. Still entirely client-side."
            />
            <BatchObfuscator settings={settings} brandName={BRAND_NAME} />
          </>
        )}

        {view === "settings" && (
          <>
            <PageHeader
              eyebrow="// tuning"
              title="Advanced settings"
              description="Fine-tune every part of the obfuscation pipeline."
            />
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
            <PageHeader
              eyebrow="// local storage"
              title="Obfuscation vault"
              description="Saved snippets and settings are stored locally in this browser. Source code is never sent to a server for this feature."
            />

            {vaultEntries.length === 0 ? (
              <div className="border border-dashed border-charcoal-700 rounded-xl px-6 py-12 text-center text-sm text-slate-500">
                Nothing saved yet. Open Advanced Settings, enable the watermark, and use the
                Save button there to add an entry here.
              </div>
            ) : (
              <div className="space-y-2 max-w-2xl">
                {vaultEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-3 border border-charcoal-700 rounded-xl px-4 py-3 bg-charcoal-900/40"
                  >
                    <div className="min-w-0 flex-1">
                      {editingVaultId === entry.id ? (
                        <input
                          autoFocus
                          value={editingLabel}
                          onChange={(e) => setEditingLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCommitRename(entry.id);
                            if (e.key === "Escape") setEditingVaultId(null);
                          }}
                          onBlur={() => handleCommitRename(entry.id)}
                          className="w-full bg-charcoal-800 border border-neon-500/50 rounded-md px-2 py-1 text-sm text-slate-100 focus-ring"
                        />
                      ) : (
                        <button
                          onClick={() => handleStartRename(entry)}
                          className="group flex items-center gap-1.5 text-sm text-slate-200 hover:text-neon-400 transition-colors max-w-full"
                        >
                          <span className="truncate">{entry.label}</span>
                          <Pencil size={11} className="opacity-0 group-hover:opacity-60 shrink-0" />
                        </button>
                      )}
                      <p className="text-xs font-mono text-slate-600 mt-0.5">
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {editingVaultId === entry.id ? (
                        <button
                          onClick={() => handleCommitRename(entry.id)}
                          aria-label="Save name"
                          className="p-1.5 rounded-lg text-neon-400 hover:bg-charcoal-800 focus-ring"
                        >
                          <Check size={15} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLoadVaultEntry(entry)}
                          className="text-xs px-2.5 py-1 rounded-lg border border-neon-500/60 text-neon-400 hover:bg-neon-500 hover:text-charcoal-950 hover:border-neon-500 transition-colors focus-ring"
                        >
                          Load
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteVaultEntry(entry.id)}
                        aria-label="Delete saved entry"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-charcoal-800 focus-ring"
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
            <PageHeader
              eyebrow="// read me"
              title={`About ${BRAND_NAME}`}
              description="What this tool does, how it protects your code, and where the limits are."
            />

            <div className="max-w-3xl grid sm:grid-cols-3 gap-3">
              {[
                {
                  icon: ShieldCheck,
                  title: "Nothing uploaded",
                  body: "There is no backend. Obfuscation, minification, and secret scanning all run inside your browser.",
                },
                {
                  icon: Cpu,
                  title: "Multi-language",
                  body: "JS/TS/JSX/TSX are obfuscated. HTML scripts are obfuscated and minified. CSS/JSON are minified only.",
                },
                {
                  icon: Lock,
                  title: "Local by default",
                  body: "Your Vault, watermark preference, and settings live only in this browser's local storage.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="border border-charcoal-700 rounded-xl p-4 bg-charcoal-900/40">
                  <Icon size={18} className="text-neon-400 mb-2.5" />
                  <p className="text-sm font-display text-slate-200">{title}</p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>

            <div className="max-w-2xl space-y-4 pt-2">
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <HelpCircle size={12} />
                FAQ
              </p>
              {[
                {
                  q: "Can this be reversed?",
                  a: "No. Obfuscation is one-directional. Keep a safe copy of your original source -- this tool cannot restore it.",
                },
                {
                  q: "Why was my HTML/CSS/JSON only minified?",
                  a: "CSS and JSON have no executable logic to hide, so they're minified rather than obfuscated. For HTML, inline <script> blocks are obfuscated and the surrounding markup is minified.",
                },
                {
                  q: "Do I need an account?",
                  a: "No signup, no login. The Vault uses your browser's local storage, so entries stay on the device and browser you saved them in.",
                },
                {
                  q: "What is the Protection Score?",
                  a: "A live estimate (0-100) of how strong your current Advanced Settings are, based on which controls are enabled.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="border-b border-charcoal-800 pb-4">
                  <p className="text-sm text-slate-200">{q}</p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </>
        )}

        <Footer onNavigate={setView} brandName={BRAND_NAME} />
      </main>
    </div>
  );
}
