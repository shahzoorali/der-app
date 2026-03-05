import type { Metadata, Viewport } from "next";
import { Outfit, Playball } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const playball = Playball({
  variable: "--font-playball",
  subsets: ["latin"],
  weight: ["400"],
});


export const metadata: Metadata = {
  title: "Daawat E Ramzaan | India's Biggest Ramzaan Experience",
  description: "Shop. Indulge. Immerse. Experience the magic of Ramzaan at Hyderabad's grandest cultural festival.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Daawat-e-Ramzaan",
  },
  icons: {
    icon: "/der-pwa-icon.png",
    shortcut: "/der-pwa-icon.png",
    apple: "/der-pwa-maskable.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2b5ea7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* PWA meta tags for maximum compatibility */}
        <link rel="apple-touch-icon" href="/der-pwa-maskable.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/der-pwa-maskable.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/der-pwa-icon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/der-pwa-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Daawat-e-Ramzaan" />
        <meta name="application-name" content="Daawat-e-Ramzaan" />
        <meta name="msapplication-TileColor" content="#2b5ea7" />
        <meta name="msapplication-TileImage" content="/der-pwa-maskable.png" />
      </head>
      <body className={`${outfit.variable} ${playball.variable} antialiased selection:bg-brand-gold selection:text-brand-blue`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
