import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Fakturační portál",
  description: "Portál pro nahrávání faktur od externích dodavatelů",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body className={`${inter.className} antialiased bg-gray-50 min-h-screen`}>
        <nav className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/nahrat" className="text-lg font-bold text-gray-900">
              Fakturační portál
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/nahrat" className="text-gray-600 hover:text-gray-900">
                Nahrát fakturu
              </Link>
              <Link href="/ucet" className="text-gray-600 hover:text-gray-900">
                Můj účet
              </Link>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
