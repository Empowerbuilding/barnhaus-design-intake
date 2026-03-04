import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Design Your Home | Barnhaus Steel Builders',
  description: 'Design your custom steel home with Barnhaus. Guided floor plan configurator with live preview.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
