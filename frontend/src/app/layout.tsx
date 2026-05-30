import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { KarmaProvider } from "@/state/karma";
import { Header } from "@/components/Header";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Karma — capa de confianza de la economía de agentes",
  description:
    "Marketplace de agentes AI con reputación on-chain. Cada pago construye karma; el que falla recibe una calavera irrevocable.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body>
        <KarmaProvider>
          <div className="flex h-screen flex-col overflow-hidden">
            <Header />
            <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
          </div>
        </KarmaProvider>
      </body>
    </html>
  );
}
