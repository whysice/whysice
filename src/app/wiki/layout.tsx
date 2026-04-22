'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Pill, Search } from 'lucide-react'

const WIKI_NAV = [
  { href: '/wiki/conditions', label: 'Conditions', icon: BookOpen, match: (p: string) => p.startsWith('/wiki/conditions') },
  { href: '/wiki/medications', label: 'Medications', icon: Pill, match: (p: string) => p.startsWith('/wiki/medications') },
  { href: '/wiki/search', label: 'Search', icon: Search, match: (p: string) => p === '/wiki/search' },
]

export default function WikiLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''

  return (
    <div>
      <div className="bg-white border-b border-tanzanite-100 sticky top-14 sm:top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto">
            <div className="flex items-center gap-2 pr-4 mr-2 border-r border-tanzanite-100 py-2.5">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-tanzanite-500">Canine Dermatology Wiki</span>
            </div>
            {WIKI_NAV.map(({ href, label, icon: Icon, match }) => {
              const active = match(pathname)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    active
                      ? 'text-tanzanite-800 border-tanzanite-500'
                      : 'text-slate border-transparent hover:text-tanzanite-700'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
