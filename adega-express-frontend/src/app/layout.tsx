import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { Toaster } from "react-hot-toast";
import Footer from "@/components/Footer";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Adega Express — Maison de Bebidas Não Alcoólicas",
  description:
    "Curadoria de águas minerais, sucos integrais, refrigerantes clássicos e infusões botânicas prontas para consumo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${jakartaSans.variable} ${jetbrainsMono.variable} ${cormorant.variable} antialiased bg-[#0e0c0a] text-[#f4efe6] min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <CartProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "#181411",
                  color: "#f4efe6",
                  border: "1px solid rgba(201, 162, 86, 0.28)",
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: 500,
                },
              }}
            />
            <div className="flex-grow">{children}</div>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
