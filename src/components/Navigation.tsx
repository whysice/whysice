'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PawPrint, Search, Menu, X } from 'lucide-react'

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="bg-tanzanite-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <PawPrint className="w-6 h-6 sm:w-7 sm:h-7 text-ice-200" />
            <span className="text-lg sm:text-xl font-bold tracking-tight">Whysice</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/conditions" className="text-tanzanite-100 hover:text-white transition-colors text-sm font-medium">
              Conditions
            </Link>
            <Link href="/medications" className="text-tanzanite-100 hover:text-white transition-colors text-sm font-medium">
              Medications
            </Link>
            <Link href="/search" className="text-tanzanite-100 hover:text-white transition-colors text-sm font-medium">
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </Link>
            <Link href="/dashboard" className="bg-tanzanite-500 hover:bg-tanzanite-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              My Dashboard
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-tanzanite-700 transition-colors"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-tanzanite-700 mt-1 pt-3 space-y-1">
            <Link href="/conditions" onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-tanzanite-100 hover:bg-tanzanite-700 hover:text-white transition-colors text-sm font-medium">
              Conditions
            </Link>
            <Link href="/medications" onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-tanzanite-100 hover:bg-tanzanite-700 hover:text-white transition-colors text-sm font-medium">
              Medications
            </Link>
            <Link href="/search" onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-tanzanite-100 hover:bg-tanzanite-700 hover:text-white transition-colors text-sm font-medium">
              <Search className="w-4 h-4 inline mr-1.5" />Search
            </Link>
            <Link href="/dashboard" onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-tanzanite-100 hover:bg-tanzanite-700 hover:text-white transition-colors text-sm font-medium">
              My Dashboard
            </Link>
            <Link href="/dashboard/symptoms" onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-tanzanite-100 hover:bg-tanzanite-700 hover:text-white transition-colors text-sm font-medium pl-6">
              Symptom Log
            </Link>
            <Link href="/dashboard/treatments" onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-tanzanite-100 hover:bg-tanzanite-700 hover:text-white transition-colors text-sm font-medium pl-6">
              Treatments
            </Link>
            <Link href="/dashboard/documents" onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-tanzanite-100 hover:bg-tanzanite-700 hover:text-white transition-colors text-sm font-medium pl-6">
              Documents
            </Link>
            <Link href="/dashboard/visits" onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-tanzanite-100 hover:bg-tanzanite-700 hover:text-white transition-colors text-sm font-medium pl-6">
              Vet Visits
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
