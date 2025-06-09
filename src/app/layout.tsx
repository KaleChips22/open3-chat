import "@/styles/globals.css";
import "@/styles/markdown.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { ConvexClientProvider } from "./ConvexClientProvider";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export const metadata: Metadata = {
  title: "Open3 Chat - AI Conversations",
  description: "Experience the future of AI conversation with Open3 Chat",
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
    <html lang="en" className={`${geist.variable} dark`}>
      <body className="dark">
        <TRPCReactProvider>
          <ConvexClientProvider>
            <ClerkProvider appearance={{
              baseTheme: dark,
              variables: {
                colorPrimary: "#8b5cf6",
                colorBackground: "#0f0f1a",
                colorInputBackground: "#1e1e3f",
                colorInputText: "#f8fafc",
              },
              elements: {
                formButtonPrimary: {
                  background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #7c3aed, #9333ea)",
                  }
                },
                card: {
                  background: "rgba(139, 92, 246, 0.1)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(139, 92, 246, 0.2)",
                }
              }
            }}>
              {children}
            </ClerkProvider>
          </ConvexClientProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}