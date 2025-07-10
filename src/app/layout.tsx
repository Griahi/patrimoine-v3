import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/Toaster";
import { AuthPersistence } from "@/components/layout/AuthPersistence";
import ChatWidget from "@/components/ai/ChatWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Patrimoine Manager",
  description: "Application de gestion de patrimoine privé",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider>
          <Navbar />
          {children}
          <AuthPersistence />
          <Toaster />
          <ChatWidget />
        </SessionProvider>
      </body>
    </html>
  );
}
