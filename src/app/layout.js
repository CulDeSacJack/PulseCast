import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata = {
  title: "PULSECAST",
  description: "Gaming news, curated. Top stories, deal alerts, and Bluesky social feeds from 40+ sources — all in one place.",
openGraph: {
    title: "PULSECAST",
    description: "Gaming news, curated. Top stories, deals, and social feeds from 40+ sources.",
    siteName: "PulseCast",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "PULSECAST",
    description: "Gaming news, curated. Top stories, deals, and social feeds from 40+ sources.",
  },
  
};
export const viewport = {
  themeColor: "#0b0b12",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}