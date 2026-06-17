import type { Metadata } from "next";
import "@carbon/styles/css/styles.min.css";
import "./globals.scss";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "QuantV1",
  description: "XAUUSD Quant Trading System Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
