import type { Metadata } from 'next'
import '../styles/globals.css'
import { Navigation } from '@/components/Navigation'
import { ToastProvider } from '@/contexts/ToastContext'
import Link from 'next/link'
import { PawPrint } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Whysice — veterinary tools',
  description: 'A hub of veterinary tools: a canine dermatology wiki, a cross-specialty drug reference, a universal animal ID, and a personal pet health tracker.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <ToastProvider>
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
                    Veterinary tools for owners and clinicians. Inspired by Icy, born December 27.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm mb-3">Derm Wiki</h4>
                  <div className="space-y-2">
                    <Link href="/wiki" className="block text-sm hover:text-white transition-colors">Overview</Link>
                    <Link href="/wiki/conditions" className="block text-sm hover:text-white transition-colors">Conditions</Link>
                    <Link href="/wiki/medications" className="block text-sm hover:text-white transition-colors">Medications</Link>
                    <Link href="/wiki/search" className="block text-sm hover:text-white transition-colors">Search</Link>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm mb-3">Health Tracker</h4>
                  <div className="space-y-2">
                    <Link href="/dashboard" className="block text-sm hover:text-white transition-colors">Dashboard</Link>
                    <Link href="/dashboard/symptoms" className="block text-sm hover:text-white transition-colors">Symptom Log</Link>
                    <Link href="/dashboard/treatments" className="block text-sm hover:text-white transition-colors">Treatments</Link>
                    <Link href="/dashboard/documents" className="block text-sm hover:text-white transition-colors">Documents</Link>
                  </div>
                </div>
              </div>
              <div className="border-t border-tanzanite-700 mt-8 pt-6 text-center space-y-2">
                <p className="text-xs text-tanzanite-400">
                  Not a substitute for veterinary advice. Always consult your veterinarian.
                </p>
                <p className="text-xs text-tanzanite-400">
                  &copy; {new Date().getFullYear()} Whysice. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  )
}
