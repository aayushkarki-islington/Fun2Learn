import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito, Lilita_One } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../context/theme-context";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-nunito',
})

const lilita = Lilita_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-lilita',
})

export const metadata: Metadata = {
  title: "Fun2Learn",
  description: "A gamified learning platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${nunito.variable} ${lilita.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
