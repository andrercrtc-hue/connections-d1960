// app/layout.tsx
import "./globals.css"; // Se o ficheiro globals.css estiver na pasta app
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Rotary Nexus - Distrito 1960",
  description: "Portal de gestão distrital",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className={inter.className}>
        {/* Aqui NÃO vai sidebar nem nav, apenas o children */}
        {children}
      </body>
    </html>
  );
}