import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Inventarios MPDL",
  description: "Sistema de Gestión de Inventarios de Productos de Limpieza - MPDL",
  manifest: "/manifest.json",
    generator: 'v0.dev'
}

export function generateViewport(): Viewport {
  return {
    themeColor: "#1e7bb8",
    width: "device-width",
    initialScale: 1,
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
