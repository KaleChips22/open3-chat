import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { ConvexClientProvider } from "./ConvexClientProvider";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export const metadata: Metadata = {
  title: "Open3 Chat",
  description: "An open source LLM chat application built for Theo's T3 Chat Cloneathon",
  authors: [{ name: "Kale", url: "https://github.com/KaleChips22" }],
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <TRPCReactProvider>
          <ConvexClientProvider>
            <ClerkProvider appearance={{
              baseTheme: dark,
            }}>
              {children}
            </ClerkProvider>
          </ConvexClientProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
