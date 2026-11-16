import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastContainer } from "@/components/shared/ToastNotification";
import ChunkErrorRecovery from "@/components/shared/ChunkErrorRecovery";

export const metadata: Metadata = {
  title: "Brains & Taxes - Client & Practice Portal",
  description: "Smart document vault, tax filing tracker, banker dockets & fee payments by Brains & Taxes and GPA & Co., Chartered Accountants.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Brains & Taxes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#e52320",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Early FOUC & Stale Chunk Safeguard (runs before any bundles execute)
              window.addEventListener('error', function(e) {
                var target = e.target || e.srcElement;
                if (target && target.tagName === 'LINK' && target.rel === 'stylesheet') {
                  if (target.href && target.href.indexOf('/_next/static/') !== -1) {
                    console.warn('[FOUC Safeguard] Stale stylesheet detected. Purging cache and refreshing...');
                    if ('caches' in window) {
                      caches.keys().then(function(keys) {
                        return Promise.all(keys.map(function(k) { return caches.delete(k); }));
                      });
                    }
                    var count = parseInt(sessionStorage.getItem('bt_fouc_reload') || '0', 10);
                    if (count < 2) {
                      sessionStorage.setItem('bt_fouc_reload', (count + 1).toString());
                      var url = new URL(window.location.href);
                      url.searchParams.set('_v', Date.now().toString());
                      window.location.replace(url.toString());
                    }
                  }
                }
              }, true);
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen min-h-[100dvh] bg-slate-50 text-slate-900 selection:bg-btred-logo selection:text-white flex flex-col">
        {/*
          ChunkErrorRecovery: client component that attaches a window-level
          'error' listener to intercept ChunkLoadErrors BEFORE they bubble to
          ErrorBoundary. This covers errors thrown outside React's render tree
          (e.g. dynamic import() calls in event handlers or useEffect).
        */}
        <ChunkErrorRecovery />
        <ToastContainer />
        {children}
      </body>
    </html>
  );
}
