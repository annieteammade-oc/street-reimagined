import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Street Reimagined - Transform je straat',
  description: 'Neem een foto van je straat en transformeer het met AI naar een groener, leefbaarder alternatief',
  keywords: 'straat, transformatie, AI, groen, deelmobiliteit, parkeren, buurt',
  authors: [{ name: 'Team Made' }],
  themeColor: '#3B82F6',
  viewport: 'width=device-width, initial-scale=1',
  openGraph: {
    title: 'Street Reimagined',
    description: 'Transform je straat met AI',
    type: 'website',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <head>
        <script src="https://js.puter.com/v2/" async></script>
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
          <header className="bg-white shadow-sm">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold text-gray-900">Street Reimagined</h1>
              <p className="text-sm text-gray-600 mt-1">Transform je straat naar een groener alternatief</p>
            </div>
          </header>
          <main className="max-w-4xl mx-auto px-4 py-6">
            {children}
          </main>
          <footer className="bg-gray-50 border-t mt-12">
            <div className="max-w-4xl mx-auto px-4 py-6 text-center">
              <p className="text-sm text-gray-600">
                Powered by AI • Made with ❤️ by Team Made • 
                <a href="https://autodelen.net" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-2">
                  Ontdek deelmobiliteit →
                </a>
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}