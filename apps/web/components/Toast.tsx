"use client";

import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export type ToastType = "error" | "warning" | "success" | "info";

export interface ToastMessage {
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

const ICONS: Record<ToastType, typeof AlertTriangle> = {
  error: AlertTriangle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

const STYLES: Record<ToastType, string> = {
  error: "border-red-500/50 bg-red-950/90 text-red-300",
  warning: "border-amber-500/50 bg-amber-950/90 text-amber-300",
  success: "border-neon-500/50 bg-charcoal-900/95 text-neon-400",
  info: "border-slate-500/50 bg-charcoal-900/95 text-slate-300",
};

export default function Toast({ toast, onClose }: ToastProps) {
  if (!toast) return null;
  const Icon = ICONS[toast.type];

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-md px-0">
      <div
        role="alert"
        className={`flex items-start gap-3 border rounded-md px-4 py-3 shadow-lg backdrop-blur ${STYLES[toast.type]}`}
      >
        <Icon size={18} className="mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{toast.title}</p>
          {toast.description && (
            <p className="text-xs mt-1 opacity-90 leading-relaxed break-words">
              {toast.description}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Dismiss"
          className="shrink-0 text-current opacity-70 hover:opacity-100 focus-ring rounded"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
