import type { Metadata } from 'next'
import '../styles/globals.css'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'
import { PawPrint } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Whysice | Canine Dermatology Wiki',
  description: 'Evidence-based canine dermatology knowledge base with personal health tracking. Built for dog owners and veterinary professionals.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <Navigation />

        <main id="main-content" className="min-h-screen">
          {children}
        </main>

        <footer className="bg-tanzanite-800 text-tanzanite-200 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <PawPrint className="w-5 h-5 text-ice-200" />
                  <span className="font-bold text-white">Whysice</span>
                </div>
                <p className="text-sm text-tanzanite-300">
                  Evidence-based canine dermatology knowledge base. Inspired by Icy, born December 27.
                </p>
                <p className="text-xs text-tanzanite-400 mt-2">
                  Tanzanite birthstone palette
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 text-sm">Knowledge Base</h4>
                <div className="space-y-2">
                  <Link href="/conditions" className="block text-sm hover:text-white transition-colors">Conditions</Link>
                  <Link href="/medications" className="block text-sm hover:text-white transition-colors">Medications</Link>
                  <Link href="/search" className="block text-sm hover:text-white transition-colors">Search</Link>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 text-sm">Tracking</h4>
                <div className="space-y-2">
                  <Link href="/dashboard" className="block text-sm hover:text-white transition-colors">My Dashboard</Link>
                  <Link href="/dashboard/symptoms" className="block text-sm hover:text-white transition-colors">Symptom Log</Link>
                  <Link href="/dashboard/treatments" className="block text-sm hover:text-white transition-colors">Treatment History</Link>
                  <Link href="/dashboard/documents" className="block text-sm hover:text-white transition-colors">Vet Documents</Link>
                </div>
              </div>
            </div>
            <div className="border-t border-tanzanite-700 mt-8 pt-6 text-center text-xs text-tanzanite-400">
              Whysice is an informational resource and does not replace veterinary care. Always consult your veterinarian for diagnosis and treatment.
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
