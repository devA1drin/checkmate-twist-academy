import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { GuestBanner } from "@/components/layout/guest-banner";
import { BottomNav } from "@/components/layout/bottom-nav";
import { NetworkStatus } from "@/components/layout/network-status";

const text = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-text", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Checkmate & Twist Academy", template: "%s · Checkmate & Twist Academy" },
  description: "Learn chess and the Rubik's Cube: structured lessons, Stockfish analysis, a 3D cube simulator, verified algorithms, timers, quizzes and more.",
};
export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0b1220" }, { media: "(prefers-color-scheme: light)", color: "#f4efe4" }],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${text.variable} ${mono.variable} antialiased min-h-screen flex flex-col`}>
        <Providers>
          <Navbar />
          <GuestBanner />
          <NetworkStatus />
          <main id="main" className="flex-1 pb-safe">{children}</main>
          <Footer />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
