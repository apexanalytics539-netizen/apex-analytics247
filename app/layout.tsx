import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apex Analytics",
  description: "AI-powered sports predictions across 159+ leagues worldwide.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}