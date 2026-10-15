import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kartu Pelajar Digital | Student ID OS",
  description: "Fondasi kartu pelajar digital yang aman dan mudah diakses.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#102b50", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
