import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Agency SF",
  description: "Internal operations portal for Startup Factory",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
