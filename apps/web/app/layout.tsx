import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adevos-X Tech Obfuscator",
  description:
    "Client-side JavaScript obfuscation with granular controls, live security scanning, and zero source-code upload.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="bg-charcoal-950 text-slate-100 font-body antialiased">
        {children}
      </body>
    </html>
  );
}
