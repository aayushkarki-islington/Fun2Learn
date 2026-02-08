import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito, Lilita_One } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../context/theme-context";
import { UserProvider } from "../context/user-context";
import { Toaster } from "sonner";
import { getThemeCookie } from "./utils/themeUtils";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getThemeCookie();

  return (
    <html lang="en" className={theme === "dark" ? "dark" : ""}>
      <body
        className={`${nunito.variable} ${lilita.variable} antialiased`}
      >
        <ThemeProvider initialTheme={theme}>
          <UserProvider>
            {children}
          </UserProvider>
          <Toaster richColors closeButton position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
