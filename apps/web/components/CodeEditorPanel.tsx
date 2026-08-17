"use client";

import dynamic from "next/dynamic";
import { Copy, Download, Check, Upload, Eraser } from "lucide-react";
import { useRef, useState } from "react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-sm text-slate-500">
      Loading editor...
    </div>
  ),
});

interface CodeEditorPanelProps {
  title: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  language?: string;
  downloadFileName?: string;
  onUpload?: (content: string, fileName: string) => void;
  onClear?: () => void;
}

const ACCEPTED_EXTENSIONS = ".js,.jsx,.ts,.tsx,.mjs,.cjs,.txt";

export default function CodeEditorPanel({
  title,
  value,
  onChange,
  readOnly = false,
  language = "javascript",
  downloadFileName,
  onUpload,
  onClear,
}: CodeEditorPanelProps) {
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const blob = new Blob([value], { type: "text/javascript" });
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
    // Reset so the same file can be re-selected later if needed.
    e.target.value = "";
  };

  return (
    <div className="flex flex-col h-full border border-charcoal-700 rounded-md overflow-hidden bg-charcoal-900">
      <div className="flex items-center justify-between px-3 h-11 border-b border-charcoal-700 shrink-0">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {title}
        </span>
        <div className="flex items-center gap-1">
          {onUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                onChange={handleFileSelected}
                className="hidden"
              />
              <button
                onClick={handleUploadClick}
                aria-label="Upload file"
                className="p-1.5 rounded text-slate-400 hover:text-neon-500 hover:bg-charcoal-800 focus-ring"
              >
                <Upload size={15} />
              </button>
            </>
          )}
          {readOnly && (
            <>
              <button
                onClick={handleCopy}
                aria-label="Copy to clipboard"
                className="p-1.5 rounded text-slate-400 hover:text-neon-500 hover:bg-charcoal-800 focus-ring"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
              <button
                onClick={handleDownload}
                aria-label="Download file"
                className="p-1.5 rounded text-slate-400 hover:text-neon-500 hover:bg-charcoal-800 focus-ring"
              >
                <Download size={15} />
              </button>
            </>
          )}
          {onClear && (
            <button
              onClick={onClear}
              aria-label="Clear"
              className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-charcoal-800 focus-ring"
            >
              <Eraser size={15} />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-[280px]">
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
            fontFamily: "JetBrains Mono, monospace",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: "on",
            padding: { top: 12 },
          }}
        />
      </div>
    </div>
  );
}
