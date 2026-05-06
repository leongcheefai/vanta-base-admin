import type * as React from 'react'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'

export interface NavItem {
  label: string
  href: string
  icon?: React.ReactNode
  active?: boolean
}

export interface DashboardShellProps {
  children: React.ReactNode
  navItems: NavItem[]
  userName?: string
  userEmail?: string
  onSignOut?: () => void
  renderNavLink?: (item: NavItem & { className: string; isCollapsed: boolean }) => React.ReactNode
  sidebarFooter?: React.ReactNode
}

export function DashboardShell({
  children,
  navItems,
  userName,
  userEmail,
  onSignOut,
  renderNavLink,
  sidebarFooter,
}: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== '[') return
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      )
        return
      setIsCollapsed((prev) => !prev)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          'hidden shrink-0 flex-col border-r bg-card md:flex overflow-hidden transition-[width] duration-200 ease-in-out',
          isCollapsed ? 'w-16' : 'w-60',
        )}
      >
        <div className="flex h-14 shrink-0 items-center border-b px-3 gap-2">
          {!isCollapsed && (
            <span className="flex-1 font-semibold tracking-tight whitespace-nowrap">Praxor Kit</span>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className={cn(
              'flex shrink-0 items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
              isCollapsed && 'w-full',
            )}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const className = cn(
                'flex w-full items-center rounded-md py-2 text-sm transition-colors',
                isCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3',
                item.active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
              return (
                <li key={item.href} title={isCollapsed ? item.label : undefined}>
                  {renderNavLink ? (
                    renderNavLink({ ...item, className, isCollapsed })
                  ) : (
                    <a href={item.href} className={className}>
                      {item.icon && <span className="size-4 shrink-0">{item.icon}</span>}
                      {!isCollapsed && item.label}
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        {!isCollapsed && sidebarFooter && (
          <div className="px-3 pb-2">{sidebarFooter}</div>
        )}

        <div className="border-t p-3">
          <div
            className={cn(
              'flex items-center rounded-md px-3 py-2',
              isCollapsed ? 'justify-center px-0' : 'gap-2.5',
            )}
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              {(userName ?? userEmail ?? '?')[0]?.toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                {userName && (
                  <p className="truncate text-sm font-medium leading-none">{userName}</p>
                )}
                {userEmail && (
                  <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                )}
              </div>
            )}
          </div>
          {!isCollapsed && onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="mt-0.5 w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Sign out
            </button>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center border-b bg-card px-4 md:hidden">
          <span className="font-semibold tracking-tight">Praxor Kit</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
