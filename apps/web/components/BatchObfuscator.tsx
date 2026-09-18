"use client";

import { useRef, useState } from "react";
import {
  UploadCloud,
  FileCode,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import { ObfuscationResult, ObfuscationSettings, SourceLanguage } from "@/lib/types";
import { detectLanguageFromFileName, detectLanguage, LANGUAGE_LABELS } from "@/lib/languageDetect";
import { ObfuscationSyntaxError, runObfuscation, formatBytes } from "@/lib/obfuscate";
import { analyzeSourceForSecrets } from "@/lib/securityScanner";

interface BatchFile {
  id: string;
  name: string;
  language: SourceLanguage;
  sourceCode: string;
  status: "pending" | "done" | "error";
  result?: ObfuscationResult;
  error?: string;
  hasSecrets: boolean;
}

interface BatchObfuscatorProps {
  settings: ObfuscationSettings;
  brandName: string;
}

const EXTENSION_FOR: Record<SourceLanguage, string> = {
  javascript: "js",
  typescript: "js",
  jsx: "js",
  tsx: "js",
  html: "html",
  css: "css",
  json: "json",
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function BatchObfuscator({ settings, brandName }: BatchObfuscatorProps) {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const addFiles = async (fileList: FileList) => {
    const newFiles: BatchFile[] = [];
    for (const file of Array.from(fileList)) {
      const content = await file.text();
      const language = detectLanguageFromFileName(file.name) ?? detectLanguage(content);
      const hasSecrets = analyzeSourceForSecrets(content).some((a) => a.type === "critical");
      newFiles.push({
        id: makeId(),
        name: file.name,
        language,
        sourceCode: content,
        status: "pending",
        hasSecrets,
      });
    }
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleProcessAll = () => {
    setProcessing(true);
    setFiles((prev) =>
      prev.map((f) => {
        try {
          const result = runObfuscation(
            f.sourceCode,
            { ...settings, language: f.language },
            brandName
          );
          return { ...f, status: "done" as const, result, error: undefined };
        } catch (err) {
          const message =
            err instanceof ObfuscationSyntaxError
              ? `Line ${err.line ?? "?"}: ${err.message}`
              : "Could not process this file.";
          return { ...f, status: "error" as const, error: message };
        }
      })
    );
    setProcessing(false);
  };

  const handleDownloadZip = async () => {
    const done = files.filter((f) => f.status === "done" && f.result);
    if (done.length === 0) return;

    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    done.forEach((f) => {
      const base = f.name.replace(/\.[^.]+$/, "");
      const ext = f.result ? EXTENSION_FOR[f.result.language] : "js";
      zip.file(`${base}.obfuscated.${ext}`, f.result!.code);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "adevos-x-batch-output.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRemove = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));
  const handleClearAll = () => setFiles([]);

  const doneCount = files.filter((f) => f.status === "done").length;

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl px-6 py-10 text-center cursor-pointer transition-colors ${
          dragActive ? "border-neon-500 bg-neon-500/5" : "border-charcoal-700 hover:border-charcoal-600"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".js,.jsx,.ts,.tsx,.mjs,.cjs,.html,.htm,.css,.json,.txt"
          onChange={handleInputChange}
          className="hidden"
        />
        <UploadCloud size={28} className="mx-auto text-slate-500 mb-2" />
        <p className="text-sm text-slate-300">Drag and drop files here, or click to browse</p>
        <p className="text-xs text-slate-500 mt-1">
          Accepts .js, .ts, .jsx, .tsx, .html, .css, .json -- processed entirely in your browser
        </p>
      </div>

      {files.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleProcessAll}
              disabled={processing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-neon-500 text-charcoal-950 font-medium hover:bg-neon-400 transition-colors disabled:opacity-50 focus-ring"
            >
              {processing ? <Loader2 size={16} className="animate-spin" /> : <FileCode size={16} />}
              Process all ({files.length})
            </button>
            <button
              onClick={handleDownloadZip}
              disabled={doneCount === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-charcoal-600 text-slate-200 hover:border-neon-500 hover:text-neon-400 transition-colors disabled:opacity-40 focus-ring"
            >
              <Download size={16} />
              Download ZIP ({doneCount})
            </button>
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-charcoal-600 text-slate-300 hover:border-red-500 hover:text-red-400 transition-colors focus-ring"
            >
              <Trash2 size={16} />
              Clear all
            </button>
          </div>

          <div className="space-y-2">
            {files.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between gap-3 border border-charcoal-700 rounded-xl px-4 py-3 bg-charcoal-900/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-200 truncate">{f.name}</p>
                    {f.hasSecrets && (
                      <ShieldAlert size={14} className="text-red-400 shrink-0" aria-label="Possible exposed secret" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {LANGUAGE_LABELS[f.language]}
                    {f.status === "done" && f.result && (
                      <>
                        {" "}
                        &middot; {formatBytes(f.result.originalSizeBytes)} to{" "}
                        {formatBytes(f.result.outputSizeBytes)} &middot;{" "}
                        {f.result.mode === "obfuscated" ? "Obfuscated" : "Minified"}
                      </>
                    )}
                    {f.status === "error" && (
                      <span className="text-red-400"> &middot; {f.error}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {f.status === "pending" && <span className="text-xs text-slate-500">Pending</span>}
                  {f.status === "done" && <CheckCircle2 size={18} className="text-neon-500" />}
                  {f.status === "error" && <XCircle size={18} className="text-red-400" />}
                  <button
                    onClick={() => handleRemove(f.id)}
                    aria-label="Remove file"
                    className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-charcoal-800 focus-ring"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
