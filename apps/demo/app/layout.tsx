import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BagsPay Demo - Hackathon Showcase',
  description: 'Demo site showcasing BagsPay checkout widget for Bags Hackathon',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} gotsol-theme`}>{children}</body>
    </html>
  )
}

