import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/storefront/Navbar";
import Footer from "../components/storefront/Footer";
import { GoogleAnalytics } from '@next/third-parties/google';
import MetaPixel from "../components/MetaPixel";
import { Suspense } from "react";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ferixo.com"),
  title: {
    template: "%s | Ferixo", // Automatically appends the brand to other pages
    default: "Ferixo | Premium Insulated Drinkware & Lifestyle Gear",
  },
  description: "Minimalist, high-performance insulated bottles, tumblers, and coffee cups. Engineered to keep your focus sharp and your drinks ice-cold for 24 hours.",
  openGraph: {
    title: "Ferixo | Absolute Utility Guaranteed",
    description: "Premium insulated gear with matte aesthetics and studio-grade insulation.",
    url: "https://www.ferixo.com",
    siteName: "Ferixo",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ferixo | Premium Insulated Drinkware",
    description: "Engineered for your daily commute.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><meta name="apple-mobile-web-app-title" content="Ferixo" /></head>
      {/* Adding suppressHydrationWarning tells Next.js to ignore 
        attributes injected by Chrome extensions like ColorZilla or Grammarly 
      */}
      <body 
        suppressHydrationWarning 
        className="antialiased bg-canvas text-primary flex flex-col min-h-screen"
      >
        <Suspense fallback={null}>
  <MetaPixel />
</Suspense>
        <Navbar />
        
        {/* flex-grow ensures the footer is always pushed to the bottom of the screen */}
        <main className="flex-grow">
          {children}
        </main>
        
        <Footer />
        <GoogleAnalytics gaId="G-H30E08Q2SN" />
      </body>
    </html>
  );
}