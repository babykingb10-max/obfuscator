"use client";

import dynamic from "next/dynamic";
import { Copy, Download, Check, Upload, Eraser } from "lucide-react";
import { useRef, useState } from "react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-sm text-slate-500 font-mono">
      loading editor&hellip;
    </div>
  ),
});

interface CodeEditorPanelProps {
  title: string;
  fileLabel?: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  language?: string;
  downloadFileName?: string;
  onUpload?: (content: string, fileName: string) => void;
  onClear?: () => void;
  accentClass?: string;
}

const ACCEPTED_EXTENSIONS = ".js,.jsx,.ts,.tsx,.mjs,.cjs,.html,.htm,.css,.json,.txt";

function IconBtn({
  onClick,
  label,
  children,
  hoverClass = "hover:text-neon-400",
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  hoverClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`p-1.5 rounded-md text-slate-500 hover:bg-charcoal-700/60 transition-colors focus-ring ${hoverClass}`}
    >
      {children}
    </button>
  );
}

export default function CodeEditorPanel({
  title,
  fileLabel,
  value,
  onChange,
  readOnly = false,
  language = "javascript",
  downloadFileName,
  onUpload,
  onClear,
  accentClass = "bg-neon-500",
}: CodeEditorPanelProps) {
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const ext = (downloadFileName || "output.js").split(".").pop()?.toLowerCase();
    const mimeMap: Record<string, string> = {
      js: "text/javascript",
      html: "text/html",
      css: "text/css",
      json: "application/json",
    };
    const blob = new Blob([value], { type: mimeMap[ext ?? "js"] ?? "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadFileName || "output.js";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpload(String(reader.result ?? ""), file.name);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden bg-charcoal-900 border border-charcoal-700 ring-1 ring-black/20">
      {/* Terminal-style window chrome */}
      <div className="flex items-center gap-3 pl-3.5 pr-2.5 h-10 border-b border-charcoal-700 bg-charcoal-800/60 shrink-0">
        <span className="flex gap-1.5 shrink-0" aria-hidden="true">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]/70" />
        </span>

        <span className="flex items-center gap-1.5 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${accentClass}`} />
          <span className="text-[11px] font-mono text-slate-400 truncate">
            {fileLabel ?? title.toLowerCase()}
          </span>
        </span>

        <span className="ml-auto text-[10px] font-mono text-slate-600 shrink-0">
          {value ? value.split("\n").length : 0}L
        </span>

        <div className="flex items-center gap-0.5 shrink-0 pl-1 border-l border-charcoal-700 ml-1">
          {onUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                onChange={handleFileSelected}
                className="hidden"
              />
              <IconBtn onClick={handleUploadClick} label="Upload file">
                <Upload size={14} />
              </IconBtn>
            </>
          )}
          {readOnly && (
            <>
              <IconBtn onClick={handleCopy} label="Copy to clipboard">
                {copied ? <Check size={14} className="text-neon-400" /> : <Copy size={14} />}
              </IconBtn>
              <IconBtn onClick={handleDownload} label="Download file">
                <Download size={14} />
              </IconBtn>
            </>
          )}
          {onClear && (
            <IconBtn onClick={onClear} label="Clear" hoverClass="hover:text-red-400">
              <Eraser size={14} />
            </IconBtn>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-[280px] bg-charcoal-900">
        <MonacoEditor
          height="100%"
          language={language}
          theme="vs-dark"
          value={value}
          onChange={(v) => onChange?.(v ?? "")}
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "var(--font-mono), monospace",
            fontLigatures: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: "on",
            padding: { top: 14 },
            renderLineHighlight: readOnly ? "none" : "line",
            cursorBlinking: "smooth",
          }}
        />
      </div>
    </div>
  );
}
