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
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Daawat E Ramzaan",
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
      <body className={`${outfit.variable} ${playball.variable} antialiased selection:bg-brand-gold selection:text-brand-blue`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

