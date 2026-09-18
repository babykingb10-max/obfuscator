# Adevos-X Tech Obfuscator

A fully client-side code protection tool. There is no backend -- everything
(obfuscation, minification, secret scanning, the Vault, and preferences)
runs and stays inside the visitor's own browser.

## Project layout

```
adevos-x-tech-obfuscator/
  apps/
    web/   Next.js app (deploy to Vercel) -- this is the entire product
```

Stack: Next.js 14, React 18, TypeScript, Tailwind CSS, Monaco Editor,
javascript-obfuscator, sucrase, jszip, lucide-react icons.

## Features

**Core obfuscation**
- Split-screen Monaco editor (source on the left, output on the right), with
  live line counts and syntax highlighting per language
- Presets: Low / Medium / High / Extreme, plus project presets for Node.js
  backends, React frontends, and Telegram/WhatsApp bots
- Granular controls: string array encoding (Base64/RC4/Hex), control flow
  flattening, dead code injection, identifier renaming, domain lock,
  disable console output, self-defending output, anti-debugging
- Time bomb: optional expiration date after which the obfuscated code refuses
  to run
- Custom header / watermark, with default branding or a user-supplied name
- Live **Protection Score** (Weak/Moderate/Strong/Maximum) that reflects the
  current settings, shown in Advanced Settings and next to the main actions
- Keyboard shortcut: Ctrl/Cmd+Enter to obfuscate

**Multi-language input**
- JavaScript, TypeScript, JSX, and TSX are genuinely obfuscated (TS/JSX is
  compiled to plain JS first, client-side, via `sucrase`)
- HTML has its inline `<script>` blocks obfuscated and the rest of the
  markup minified
- CSS and JSON have no executable logic to hide, so they are minified
  instead of obfuscated -- the UI is explicit about this distinction
- Language can be auto-detected, picked manually, or inferred from the file
  extension on upload
- Built-in example snippets (one per supported language) for quick testing

**Batch mode**
- Drag-and-drop or pick multiple files at once, process them all against
  the current Advanced Settings, and download every result as a single ZIP

**Safety and workflow**
- Regex-based security analyzer that flags exposed database URIs, bot
  tokens, API keys, and private keys before you share your code -- runs
  entirely client-side, with quick-fix buttons that jump to the relevant
  setting
- Before obfuscating code with hard-coded secrets, a guard dialog offers to
  encode strings (Base64/RC4/Hex) or proceed with "Obfuscate anyway"
- Clear syntax-error reporting with line/column numbers instead of failing
  silently
- Upload, Copy, Download, and Clear on both the Input and Output panels
- Vault: save/load/delete snippets and settings locally (browser storage)

**Product polish**
- Installable as a PWA (Add to Home Screen) on mobile and desktop, with
  offline app-shell caching
- Responsive layout with a hamburger sidebar menu on mobile and a fixed
  sidebar on desktop, including a "Join us" section with WhatsApp and
  Telegram links (real brand icons via Font Awesome)

## Local setup

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

## Environment variables (apps/web/.env.local)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_WHATSAPP_URL` | WhatsApp link shown in the sidebar "Join us" section |
| `NEXT_PUBLIC_TELEGRAM_URL` | Telegram link shown in the sidebar "Join us" section |
| `NEXT_PUBLIC_BRAND_NAME` | Brand name used in the default watermark |

## Deploying

Deploy on Vercel by importing the repo and setting the project's **Root
Directory** to `apps/web`, then add the environment variables above in the
Vercel project settings. That's the entire deployment -- no server, no
database, no second service to keep running.

## Security notes

- No API keys, tokens, or secrets are hard-coded anywhere in this codebase;
  configurable values are read from `NEXT_PUBLIC_*` environment variables.
- Never commit a real `.env` or `.env.local` file. Only `.env.example` is
  meant to be committed.
- Obfuscation, minification, and the security analyzer all run client-side,
  so a user's source code never has to leave their browser to use this tool.
- The Vault, watermark preference, and other settings live only in the
  visitor's own browser local storage.
