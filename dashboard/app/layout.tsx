import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Agency — Agent Dashboard",
  description: "Browse and explore 60+ specialized AI agent personalities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
