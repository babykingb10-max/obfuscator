"use client";

import { useState } from "react";
import {
  Menu,
  X,
  TerminalSquare,
  SlidersHorizontal,
  History,
  Info,
  Layers,
} from "lucide-react";

interface SidebarProps {
  activeView: "obfuscator" | "batch" | "settings" | "history" | "about";
  onNavigate: (view: "obfuscator" | "batch" | "settings" | "history" | "about") => void;
}

const NAV_ITEMS = [
  { key: "obfuscator" as const, label: "Obfuscator", icon: TerminalSquare },
  { key: "batch" as const, label: "Batch", icon: Layers },
  { key: "settings" as const, label: "Advanced settings", icon: SlidersHorizontal },
  { key: "history" as const, label: "Vault", icon: History },
  { key: "about" as const, label: "About", icon: Info },
];

function BrandMark({ size = "default" }: { size?: "default" | "compact" }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-neon-500 to-violet-500 text-charcoal-950 font-display font-bold text-sm shadow-neon shrink-0">
        AX
      </span>
      <span className={`font-display tracking-tight text-slate-100 ${size === "compact" ? "text-[13px]" : "text-sm"}`}>
        Adevos-X
        <span className="text-neon-500">.</span>
        <span className="caret text-violet-400">_</span>
      </span>
    </div>
  );
}

export default function Sidebar({ activeView, onNavigate }: SidebarProps) {
  const [open, setOpen] = useState(false);

  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL || "#";
  const telegramUrl = process.env.NEXT_PUBLIC_TELEGRAM_URL || "#";

  return (
    <>
      {/* Mobile top bar with hamburger */}
      <div className="lg:hidden w-full relative flex items-center h-14 border-b border-charcoal-700 bg-charcoal-900/90 backdrop-blur sticky top-0 z-40">
        <button
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="ml-3 p-2 rounded-md text-slate-200 hover:bg-charcoal-800 focus-ring relative z-10"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <BrandMark size="compact" />
        </span>
      </div>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-charcoal-950/80 backdrop-blur-sm z-30"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 lg:top-0 left-0 h-full lg:h-screen w-72
          bg-charcoal-900 border-r border-charcoal-700 z-40
          transform transition-transform duration-200 ease-out
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
          flex flex-col
        `}
      >
        <div className="hidden lg:flex items-center px-5 h-16 border-b border-charcoal-700 boot-in">
          <BrandMark />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-mono uppercase tracking-[0.14em] text-slate-600">
            Console
          </p>
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const active = activeView === key;
            return (
              <button
                key={key}
                onClick={() => {
                  onNavigate(key);
                  setOpen(false);
                }}
                className={`
                  group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                  transition-colors focus-ring relative
                  ${
                    active
                      ? "bg-charcoal-800 text-neon-400"
                      : "text-slate-400 hover:bg-charcoal-800/60 hover:text-slate-200"
                  }
                `}
              >
                <span
                  className={`absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full transition-opacity ${
                    active ? "bg-neon-500 opacity-100" : "opacity-0"
                  }`}
                />
                <Icon size={17} strokeWidth={active ? 2.25 : 1.75} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-charcoal-700 space-y-0.5">
          <p className="px-3 pb-2 text-[10px] font-mono uppercase tracking-[0.14em] text-slate-600">
            Join us
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-charcoal-800/60 hover:text-neon-400 transition-colors focus-ring"
          >
            <i className="fa-brands fa-whatsapp text-base w-[17px] text-center" aria-hidden="true" />
            <span>WhatsApp</span>
          </a>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-charcoal-800/60 hover:text-violet-400 transition-colors focus-ring"
          >
            <i className="fa-brands fa-telegram text-base w-[17px] text-center" aria-hidden="true" />
            <span>Telegram</span>
          </a>
        </div>
      </aside>
    </>
  );
}
