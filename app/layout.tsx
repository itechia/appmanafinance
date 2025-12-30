import type React from "react"
import type { Metadata } from "next"

import "./globals.css"
import ClientLayout from "@/app/client-layout"
import { UserProvider } from "@/lib/user-context"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "next-themes"

import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Maná Finance",
  description: "Sua prosperidade financeira começa aqui",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/favicon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Maná Finance",
  },
  formatDetection: {
    telephone: false,
  },
  generator: 'v0.app'
}

export const viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

import { Toaster } from "@/components/ui/toaster"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <UserProvider>
              <ClientLayout>{children}</ClientLayout>
              <Toaster />
            </UserProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
