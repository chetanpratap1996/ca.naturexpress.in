import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastContainer } from "@/components/shared/ToastNotification";

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
              // Global ChunkLoadError & Stale Asset Recovery Safeguard
              // Runs synchronously in <head> BEFORE any webpack chunks or React bundles execute
              (function() {
                var RELOAD_KEY = 'bt_chunk_recovery_count';
                var WINDOW_MS = 30000;
                var MAX_RELOADS = 2;

                function recoverFromChunkError(reason) {
                  try {
                    if ('caches' in window) {
                      caches.keys().then(function(keys) {
                        return Promise.all(keys.map(function(k) { return caches.delete(k); }));
                      }).catch(function() {});
                    }
                    var raw = sessionStorage.getItem(RELOAD_KEY);
                    var data = raw ? JSON.parse(raw) : { count: 0, since: Date.now() };
                    if (Date.now() - data.since > WINDOW_MS) {
                      data.count = 0;
                      data.since = Date.now();
                    }
                    if (data.count >= MAX_RELOADS) {
                      console.warn('[ChunkRecovery] Max reloads reached (' + MAX_RELOADS + '). Reason: ' + reason);
                      return;
                    }
                    data.count += 1;
                    sessionStorage.setItem(RELOAD_KEY, JSON.stringify(data));
                    var url = new URL(window.location.href);
                    url.searchParams.set('_v', Date.now().toString());
                    console.warn('[ChunkRecovery] Recovering from ' + reason + '. Reloading (' + data.count + '/' + MAX_RELOADS + ')...');
                    window.location.replace(url.toString());
                  } catch (e) {
                    window.location.reload();
                  }
                }

                // 1. Capture-phase resource error listener for explicit ChunkLoadErrors only
                window.addEventListener('error', function(e) {
                  if (e.message) {
                    var msg = e.message;
                    if (msg.indexOf('Loading chunk') !== -1 ||
                        msg.indexOf('ChunkLoadError') !== -1) {
                      recoverFromChunkError('CHUNK_RUNTIME_ERROR: ' + msg);
                    }
                  }
                }, true);

                // 2. Unhandled promise rejections (dynamic import() failures)
                window.addEventListener('unhandledrejection', function(e) {
                  var reason = e.reason;
                  var msg = (reason && (reason.message || reason.toString())) || '';
                  if (msg.indexOf('Loading chunk') !== -1 ||
                      msg.indexOf('ChunkLoadError') !== -1 ||
                      msg.indexOf('Failed to fetch dynamically imported module') !== -1) {
                    recoverFromChunkError('PROMISE_REJECTION: ' + msg);
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen min-h-[100dvh] bg-slate-50 text-slate-900 selection:bg-btred-logo selection:text-white flex flex-col">
        <ToastContainer />
        {children}
      </body>
    </html>
  );
}
