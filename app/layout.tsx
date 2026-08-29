import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { ThemeProvider, themeInitScript } from "@/lib/theme";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { RakeDrawer } from "@/components/RakeDrawer";
import { AskChatWidget } from "@/components/AskChatWidget";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "DSP Live Wagon Tracking — SAIL Durgapur",
  description: "Live Tracking & Reporting Dashboard for Railway Wagons at SAIL Durgapur Steel Plant — Pravartanam Digital Transformation Programme.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
        <StoreProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Topbar />
              <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
          </div>
          <RakeDrawer />
          <AskChatWidget />
        </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
