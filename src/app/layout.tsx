import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css"
import { Providers } from "./providers";
import { AppGate } from "@/components/AppGate";
import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "ZenFinance",
  description: "Личные финансы прямо в Telegram",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // required for safe-area-inset-* to populate on iOS
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          <AppGate>
            <main className="safe-area-top mx-auto min-h-dvh max-w-lg pb-24">{children}</main>
            <BottomNav />
          </AppGate>
        </Providers>
      </body>
    </html>
  );
}
