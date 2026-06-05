import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '@betsy_ville Command Center',
  description: 'Creator dashboard — growth, content, collabs',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
