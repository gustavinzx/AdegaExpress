import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import AgeGate from "@/components/AgeGate";
import { Toaster } from "react-hot-toast";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Adega Express",
  description: "E-commerce de bebidas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased bg-gray-50 text-slate-900 min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <CartProvider>
            <Toaster position="top-right" />
            <AgeGate />
            <div className="flex-grow">
              {children}
            </div>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
