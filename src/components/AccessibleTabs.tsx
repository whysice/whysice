'use client'

// ============================================
// UCD Optimization #9: Accessible Tabs/Filters
// Replaces button groups with proper ARIA
// tablist/tab roles for filter UIs.
// ============================================

type Tab = {
  id: string
  label: string
  count?: number
}

type AccessibleTabsProps = {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  ariaLabel: string
  size?: 'sm' | 'md'
}

export function AccessibleTabs({
  tabs,
  activeTab,
  onTabChange,
  ariaLabel,
  size = 'sm',
}: AccessibleTabsProps) {
  const sizeClasses = size === 'sm'
    ? 'px-3 py-1.5 text-xs'
    : 'px-4 py-2 text-sm'

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex gap-1.5 overflow-x-auto pb-1"
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`${sizeClasses} rounded-lg font-medium whitespace-nowrap transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tanzanite-400 focus-visible:ring-offset-1
              ${isActive
                ? 'bg-tanzanite-500 text-white'
                : 'bg-tanzanite-50 text-tanzanite-600 hover:bg-tanzanite-100'
              }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-1 ${isActive ? 'text-white/80' : 'text-tanzanite-400'}`}>
                ({tab.count})
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// Panel wrapper for tab content
type TabPanelProps = {
  tabId: string
  activeTab: string
  children: React.ReactNode
}

export function TabPanel({ tabId, activeTab, children }: TabPanelProps) {
  if (tabId !== activeTab) return null
  return (
    <div
      role="tabpanel"
      id={`tabpanel-${tabId}`}
      aria-labelledby={`tab-${tabId}`}
      tabIndex={0}
    >
      {children}
    </div>
  )
}
