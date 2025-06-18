import "@/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { ConvexClientProvider } from "./ConvexClientProvider";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: "Open3 Chat",
  description: "An open source LLM chat application built for Theo's T3 Chat Cloneathon",
  authors: [{ name: "Kale", url: "https://github.com/KaleChips22" }],
  icons: [{ rel: "icon", url: "/favicon.ico" }, { rel: "apple-touch-icon", url: "/favicon.png" }],
  // viewport: {
  //   width: 'device-width',
  //   initialScale: 1,
  //   maximumScale: 1,
  //   userScalable: false,
  // },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="min-h-screen w-full overflow-x-hidden">
        <TRPCReactProvider>
          <ConvexClientProvider>
            <ClerkProvider appearance={{
              baseTheme: dark,
            }}>
              <ThemeProvider defaultColorTheme="purple" defaultDarkMode={true}>
                <main className="relative min-h-screen w-full">
                  {children}
                </main>
              </ThemeProvider>
            </ClerkProvider>
          </ConvexClientProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
