import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// The original design uses STK Bureau Serif, a paid display typeface not
// cleared for public redistribution. Fraunces is a freely-licensed
// substitute mapped onto the same --font-bureau-serif variable, so this
// repository builds and looks right without bundling a commercial font.
const bureauSerif = Fraunces({
  variable: "--font-bureau-serif",
  subsets: ["latin"],
  weight: "300",
  style: "normal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PRONOI — Procurement Autopilot for Small Businesses",
  description: "PRONOI predicts stockout risk, selects the safest supplier, and turns inventory data into purchasing decisions.",
  icons: {
    icon: [{ url: "/pronoi/icon-512.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/pronoi/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${bureauSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
