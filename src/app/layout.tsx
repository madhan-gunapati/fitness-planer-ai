import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fitness Planner AI - Personalized Workout & Diet Plans",
  description: "Get  personalized workout and diet plan using AI. Customized to your goals, and diet  preferences .",
  keywords: ["fitness", "AI", "workout", "diet", "personalized", "health", "exercise"],
  authors: [{ name: "Madhan" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <ThemeProvider defaultTheme="light" storageKey="fitness-coach-theme">
            {children}
            <Toaster />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}