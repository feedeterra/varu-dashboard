import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VARU Distribuidora',
  description: 'Dashboard interno — Varu Distribuidora Chivilcoy',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
