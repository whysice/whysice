'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

// ============================================
// UCD Optimization #7: Breadcrumbs & Nav Awareness
// Lightweight breadcrumb for dashboard sub-pages
// so users always know where they are.
// ============================================

type Crumb = {
  label: string
  href?: string
}

type BreadcrumbsProps = {
  crumbs: Crumb[]
}

export function Breadcrumbs({ crumbs }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-xs text-slate flex-wrap">
        <li className="flex items-center gap-1">
          <Link
            href="/dashboard"
            className="hover:text-tanzanite-500 transition-colors flex items-center gap-1"
          >
            <Home className="w-3 h-3" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </li>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <li key={i} className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3 text-slate/50" aria-hidden="true" />
              {isLast || !crumb.href ? (
                <span className="font-medium text-body" aria-current={isLast ? 'page' : undefined}>
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="hover:text-tanzanite-500 transition-colors">
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Dashboard sub-nav items for the mobile menu active state
export const DASHBOARD_NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', exact: true },
  { href: '/dashboard/symptoms', label: 'Symptom Log' },
  { href: '/dashboard/treatments', label: 'Treatments' },
  { href: '/dashboard/documents', label: 'Documents' },
  { href: '/dashboard/visits', label: 'Vet Visits' },
  { href: '/dashboard/vet-prep', label: 'Vet Prep' },
]

type DashboardSubNavProps = {
  currentPath: string
}

/**
 * Dashboard sub-navigation with active state highlighting.
 * Use this inside the mobile menu to visually group and
 * highlight the current dashboard sub-page.
 */
export function DashboardSubNav({ currentPath }: DashboardSubNavProps) {
  return (
    <div className="ml-2 pl-3 border-l-2 border-tanzanite-600 space-y-0.5">
      {DASHBOARD_NAV_ITEMS.map(item => {
        const isActive = item.exact
          ? currentPath === item.href
          : currentPath.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-tanzanite-600 text-white'
                : 'text-tanzanite-200 hover:bg-tanzanite-700 hover:text-white'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}
