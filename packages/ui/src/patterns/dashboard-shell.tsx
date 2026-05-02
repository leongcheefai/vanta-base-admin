import type * as React from 'react'
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
  renderNavLink?: (item: NavItem & { className: string }) => React.ReactNode
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
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card md:flex">
        <div className="flex h-14 items-center border-b px-6">
          <span className="font-semibold tracking-tight">Praxor Kit</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const className = cn(
                'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                item.active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
              return (
                <li key={item.href}>
                  {renderNavLink ? (
                    renderNavLink({ ...item, className })
                  ) : (
                    <a href={item.href} className={className}>
                      {item.icon && <span className="size-4 shrink-0">{item.icon}</span>}
                      {item.label}
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        {sidebarFooter && <div className="px-3 pb-2">{sidebarFooter}</div>}

        <div className="border-t p-3">
          <div className="flex items-center gap-2.5 rounded-md px-3 py-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              {(userName ?? userEmail ?? '?')[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              {userName && (
                <p className="truncate text-sm font-medium leading-none">{userName}</p>
              )}
              {userEmail && (
                <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
              )}
            </div>
          </div>
          {onSignOut && (
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
