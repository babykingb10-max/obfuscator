"use client";

import { useEffect, useMemo, useState } from "react";
import { ScanSearch, Wand2, Trash2, Sparkles } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import CodeEditorPanel from "@/components/CodeEditorPanel";
import SettingsPanel from "@/components/SettingsPanel";
import WatermarkSettings from "@/components/WatermarkSettings";
import SecurityAnalyzer from "@/components/SecurityAnalyzer";
import SecretGuardModal from "@/components/SecretGuardModal";
import StatsBar from "@/components/StatsBar";
import Toast, { ToastMessage } from "@/components/Toast";
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
      <Sidebar activeView={view} onNavigate={setView} />

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10 space-y-7 max-w-6xl">
        {view === "obfuscator" && (
          <>
            <div className="boot-in">
              <PageHeader
                eyebrow="// client-side code protection"
                title="Obfuscate your code"
                description="JavaScript, TypeScript, JSX and TSX are obfuscated. HTML has its inline scripts obfuscated and the rest minified. CSS and JSON are minified. Nothing leaves your browser."
              />
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
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 truncate">{entry.label}</p>
                      <p className="text-xs font-mono text-slate-600 mt-0.5">
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleLoadVaultEntry(entry)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-neon-500/60 text-neon-400 hover:bg-neon-500 hover:text-charcoal-950 hover:border-neon-500 transition-colors focus-ring"
                      >
                        Load
                      </button>
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
            <PageHeader eyebrow="// read me" title={`About ${BRAND_NAME}`} description="" />
            <div className="max-w-2xl space-y-4 text-sm text-slate-400 leading-relaxed -mt-4">
              <p>
                {BRAND_NAME} Obfuscator is a fully client-side code protection tool -- there is no
                backend. Obfuscation, minification, string encoding, control flow flattening, and
                dead code injection all run entirely inside your browser using JavaScript.
              </p>
              <p>
                The security analyzer is a regex-based scanner that also runs locally, checking for
                common leaks such as database URIs, bot tokens, and hard-coded API keys before you
                share your code.
              </p>
              <p>
                Your Vault, watermark preference, and settings are stored only in this browser's
                local storage. Nothing is ever uploaded anywhere -- clearing your browser data
                clears them too.
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
