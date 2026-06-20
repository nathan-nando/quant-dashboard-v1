import type { Metadata } from "next";
import "@carbon/styles/css/styles.min.css";
import "./globals.scss";
import AppShell from "@/components/AppShell";
import { GlobalStateProvider } from "@/contexts/GlobalStateContext";

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
        <GlobalStateProvider>
          <AppShell>{children}</AppShell>
        </GlobalStateProvider>
      </body>
    </html>
  );
}
