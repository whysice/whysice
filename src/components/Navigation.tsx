'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PawPrint, BookOpen, Pill, Fingerprint, LayoutDashboard, Menu, X } from 'lucide-react'
import { DashboardSubNav } from './Breadcrumbs'

type Tool = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  match: (p: string) => boolean
  disabled?: boolean
}

const TOOLS: Tool[] = [
  { href: '/wiki', label: 'Wiki', icon: BookOpen, match: (p) => p === '/wiki' || p.startsWith('/wiki/') },
  { href: '/vetmed', label: 'Vet Med', icon: Pill, match: (p) => p.startsWith('/vetmed') },
  { href: '/id', label: 'ID', icon: Fingerprint, match: (p) => p.startsWith('/id'), disabled: true },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, match: (p) => p.startsWith('/dashboard') },
]

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname() || ''
  const isDashboard = pathname.startsWith('/dashboard')

  return (
    <nav className="bg-tanzanite-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <PawPrint className="w-6 h-6 sm:w-7 sm:h-7 text-ice-200" />
            <span className="text-lg sm:text-xl font-bold tracking-tight">Whysice</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {TOOLS.map(({ href, label, icon: Icon, match, disabled }) => {
              const active = match(pathname)
              const base = 'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors'
              if (disabled) {
                return (
                  <span
                    key={href}
                    aria-disabled="true"
                    title="Coming soon"
                    className={`${base} text-tanzanite-300 cursor-not-allowed`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </span>
                )
              }
              return (
                <Link
                  key={href}
                  href={href}
                  className={`${base} ${
                    active
                      ? 'bg-tanzanite-500 text-white'
                      : 'text-tanzanite-100 hover:bg-tanzanite-700 hover:text-white'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}
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
            {TOOLS.map(({ href, label, icon: Icon, match, disabled }) => {
              const active = match(pathname)
              const base = 'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors'
              if (disabled) {
                return (
                  <span
                    key={href}
                    aria-disabled="true"
                    className={`${base} text-tanzanite-300`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-tanzanite-400">Soon</span>
                  </span>
                )
              }
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`${base} ${
                    active
                      ? 'bg-tanzanite-600 text-white'
                      : 'text-tanzanite-100 hover:bg-tanzanite-700 hover:text-white'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}

            {isDashboard && (
              <div onClick={() => setMobileOpen(false)}>
                <DashboardSubNav currentPath={pathname} />
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
