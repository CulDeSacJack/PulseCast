import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
