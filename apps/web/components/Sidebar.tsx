"use client";

import { useState } from "react";
import {
  Menu,
  X,
  ShieldHalf,
  SlidersHorizontal,
  History,
  Info,
} from "lucide-react";

interface SidebarProps {
  activeView: "obfuscator" | "settings" | "history" | "about";
  onNavigate: (view: "obfuscator" | "settings" | "history" | "about") => void;
}

const NAV_ITEMS = [
  { key: "obfuscator" as const, label: "Obfuscator", icon: ShieldHalf },
  { key: "settings" as const, label: "Advanced Settings", icon: SlidersHorizontal },
  { key: "history" as const, label: "Vault (History)", icon: History },
  { key: "about" as const, label: "About", icon: Info },
];

export default function Sidebar({ activeView, onNavigate }: SidebarProps) {
  const [open, setOpen] = useState(false);

  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL || "#";
  const telegramUrl = process.env.NEXT_PUBLIC_TELEGRAM_URL || "#";

  return (
    <>
      {/* Mobile top bar with hamburger */}
      <div className="lg:hidden w-full relative flex items-center h-14 border-b border-charcoal-700 bg-charcoal-900 sticky top-0 z-40">
        <button
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="ml-3 p-2 rounded-md text-slate-200 hover:bg-charcoal-800 focus-ring relative z-10"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span className="absolute inset-0 flex items-center justify-center font-display text-sm tracking-wide text-neon-500 pointer-events-none">
          ADEVOS-X TECH
        </span>
      </div>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30"
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
        <div className="hidden lg:flex items-center gap-2 px-5 h-16 border-b border-charcoal-700">
          <ShieldHalf className="text-neon-500" size={22} />
          <span className="font-display text-sm tracking-wide text-neon-500">
            ADEVOS-X TECH
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                onNavigate(key);
                setOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm
                transition-colors focus-ring
                ${
                  activeView === key
                    ? "bg-charcoal-800 text-neon-500 shadow-neon"
                    : "text-slate-300 hover:bg-charcoal-800 hover:text-slate-100"
                }
              `}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-charcoal-700 space-y-2">
          <p className="px-3 text-xs uppercase tracking-wider text-slate-500 mb-1">
            Join us
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-slate-300 hover:bg-charcoal-800 hover:text-neon-500 transition-colors focus-ring"
          >
            <i className="fa-brands fa-whatsapp text-lg w-[18px] text-center" aria-hidden="true" />
            <span>WhatsApp</span>
          </a>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-slate-300 hover:bg-charcoal-800 hover:text-neon-500 transition-colors focus-ring"
          >
            <i className="fa-brands fa-telegram text-lg w-[18px] text-center" aria-hidden="true" />
            <span>Telegram</span>
          </a>
        </div>
      </aside>
    </>
  );
}
