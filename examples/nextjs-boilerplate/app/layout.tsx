export const metadata = {
  title: 'Human Is Kind Integration',
  description: 'Boilerplate for Human Is Kind SDK',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
