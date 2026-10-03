import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toast";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#800020" },
    { media: "(prefers-color-scheme: dark)", color: "#170b0e" },
  ],
};

export const metadata: Metadata = {
  title: "SSC Transparency | Supreme Student Council Financial & Fee Portal",
  description:
    "Official Supreme Student Council organization fee collection, digital receipt issuance, and audited financial transparency portal.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SSC Transparency",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('ssc-theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(!s&&m)){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ToastProvider>
          {children}
          <Toaster />
        </ToastProvider>
      </body>
    </html>
  );
}
