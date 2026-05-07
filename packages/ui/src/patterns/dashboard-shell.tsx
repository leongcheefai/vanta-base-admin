import type * as React from 'react'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../primitives/tooltip'

export interface NavItem {
  label: string
  href: string
  icon?: React.ReactNode
  active?: boolean
}

export interface DashboardShellProps {
  children: React.ReactNode
  topbar?: React.ReactNode
  navItems: NavItem[]
  userName?: string
  userEmail?: string
  renderNavLink?: (item: NavItem & { className: string; isCollapsed: boolean }) => React.ReactNode
  sidebarFooter?: React.ReactNode
}

export function DashboardShell({
  children,
  topbar,
  navItems,
  userName,
  userEmail,
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
    <TooltipProvider>
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
              title={isCollapsed ? 'Expand sidebar ([ key)' : 'Collapse sidebar ([ key)'}
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
                const linkNode = renderNavLink ? (
                  renderNavLink({ ...item, className, isCollapsed })
                ) : (
                  <a href={item.href} className={className} aria-label={isCollapsed ? item.label : undefined}>
                    {item.icon && <span className="size-4 shrink-0">{item.icon}</span>}
                    {!isCollapsed && item.label}
                  </a>
                )
                return (
                  <li key={item.href}>
                    {isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{linkNode}</TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    ) : (
                      linkNode
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
                'flex items-center rounded-md py-2',
                isCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3',
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
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {topbar}
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  )
}
