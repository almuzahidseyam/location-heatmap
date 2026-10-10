import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Timeline Heatmap | Google Location History Visualizer",
  description: "A 100% client-side, privacy-focused visualizer for your Google Location History (Timeline). Generate beautiful heatmaps and insights securely in your browser.",
  keywords: ["Google Timeline", "Location History", "Heatmap", "Data Visualization", "Privacy", "Deck.gl"],
  authors: [{ name: "Muhammad Al-Muzahid" }],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
