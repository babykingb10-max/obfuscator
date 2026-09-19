"use client";

interface FooterProps {
  onNavigate: (view: "obfuscator" | "batch" | "settings" | "history" | "about") => void;
  brandName: string;
}

export default function Footer({ onNavigate, brandName }: FooterProps) {
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL || "#";
  const telegramUrl = process.env.NEXT_PUBLIC_TELEGRAM_URL || "#";
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-charcoal-800 pt-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-8">
        <div className="max-w-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-neon-500 to-violet-500 text-charcoal-950 font-display font-bold text-[10px]">
              AX
            </span>
            <span className="font-display text-sm text-slate-200">{brandName}</span>
          </div>
          <p className="text-xs text-slate-600 mt-3 leading-relaxed">
            Client-side code protection for developers. Nothing you paste or upload ever leaves
            your browser.
          </p>
        </div>

        <div className="flex gap-10">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-600 mb-2.5">
              Product
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate("obfuscator")} className="hover:text-neon-400 transition-colors focus-ring rounded">
                  Obfuscator
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("batch")} className="hover:text-neon-400 transition-colors focus-ring rounded">
                  Batch processing
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("settings")} className="hover:text-neon-400 transition-colors focus-ring rounded">
                  Advanced settings
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("history")} className="hover:text-neon-400 transition-colors focus-ring rounded">
                  Vault
                </button>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-600 mb-2.5">
              Community
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-neon-400 transition-colors">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-violet-400 transition-colors">
                  Telegram
                </a>
              </li>
              <li>
                <button onClick={() => onNavigate("about")} className="hover:text-neon-400 transition-colors focus-ring rounded">
                  About
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-8 pt-6 border-t border-charcoal-800/60">
        <p className="text-[11px] font-mono text-slate-600">
          &copy; {year} {brandName}. All processing happens in your browser.
        </p>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-neon-500" />
            No backend
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            PWA ready
          </span>
        </div>
      </div>
    </footer>
  );
}
