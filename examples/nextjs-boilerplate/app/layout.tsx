import './globals.css'

export const metadata = {
  title: 'Human Is Kind | Governance Command',
  description: 'Mission Control for Deterministic AI Governance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
