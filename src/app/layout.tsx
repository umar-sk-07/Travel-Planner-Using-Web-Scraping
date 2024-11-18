import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import PageLayout from "./page-layout";
import AppProtector from "./app-protector";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hyped Journey",
  description: "The App is Powered By Bright Data",
};

export default function RootLayout({children}: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <PageLayout>{children}</PageLayout>
          <AppProtector/>
        </Providers>
      </body>
    </html>
  );
}
