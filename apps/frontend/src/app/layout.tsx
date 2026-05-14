import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pokaface — Planning Poker',
  description: 'Real-time planning poker for Scrum teams',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
