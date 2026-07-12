import "./globals.css";

export const metadata = {
  title: "AI Agency SF",
  description: "Internal operations portal for Startup Factory",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
