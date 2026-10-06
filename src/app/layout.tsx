import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import ReduxProvider from "@/components/providers/ReduxProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Geist has no Devanagari, so Marathi text falls through to Mukta (see --font-sans).
const mukta = localFont({
  src: [
    { path: "../../public/fonts/Mukta-Regular.ttf", weight: "400" },
    { path: "../../public/fonts/Mukta-Bold.ttf", weight: "700" },
  ],
  variable: "--font-mukta",
});

export const metadata: Metadata = {
  title: "MySociety",
  description: "Society management for admins and residents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${mukta.variable} antialiased`}>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
