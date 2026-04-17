import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { AnalyticsRouteTracker } from "@/components/AnalyticsRouteTracker";

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "ChatDa — See who else is here in Korea",
  description: "Korea's cross-cultural network. Find your people — locals, expats, visitors, and creators already in Korea.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "chatda",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6B35",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en" className={`${font.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorkerRegistration />
        {gaId && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', { send_page_view: false });`}
            </Script>
            <AnalyticsRouteTracker />
          </>
        )}
      </body>
    </html>
  );
}
