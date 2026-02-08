import type { Metadata, Viewport } from "next";
import { RootProvider } from "./rootProvider";

export const metadata: Metadata = {
  title: "BTC Battle - Real-Time Whale War",
  description: "Watch bulls and bears fight for Bitcoin dominance in real-time",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/favicon-192.png",
  },
  openGraph: {
    title: "BTC Battle - Real-Time Whale War",
    description: "Watch bulls and bears fight for Bitcoin dominance",
    images: ["https://base-signal.vercel.app/og.png"],
  },
  other: {
    "fc:frame": JSON.stringify({
      version: "1",
      imageUrl: "https://base-signal.vercel.app/og.png",
      button: {
        title: "Open BTC Battle",
        action: {
          type: "launch_frame",
          name: "BTC Battle",
          url: "https://base-signal.vercel.app",
          splashImageUrl: "https://base-signal.vercel.app/splash.png",
          splashBackgroundColor: "#0a0a0f"
        }
      }
    })
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/favicon-192.png" sizes="192x192" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <RootProvider>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
