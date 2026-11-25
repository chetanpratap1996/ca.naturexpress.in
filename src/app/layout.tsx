import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastContainer } from "@/components/shared/ToastNotification";
import { ClientProvider } from "@/lib/context/ClientContext";

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
      <body suppressHydrationWarning className="antialiased min-h-screen min-h-[100dvh] bg-slate-50 text-slate-900 selection:bg-btred-logo selection:text-white flex flex-col">
        <ToastContainer />
        <ClientProvider>
          {children}
        </ClientProvider>
      </body>
    </html>
  );
}
