import { useNavigate, Outlet, useLocation, Link } from 'react-router'
import { DashboardShell, type NavItem, Button } from '@praxor-kit/ui'
import { ProtectedRoute } from '../../components/protected-route'
import { FeedbackDialog } from '../../components/feedback-dialog'
import { signOut, useSession } from '../../lib/auth'

function navItems(pathname: string): NavItem[] {
  return [
    { label: 'Dashboard', href: '/dashboard', active: pathname === '/dashboard' },
    { label: 'Billing', href: '/dashboard/billing', active: pathname === '/dashboard/billing' },
    { label: 'Settings', href: '/dashboard/settings', active: pathname === '/dashboard/settings' },
  ]
}

function DashboardContent() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { data: session } = useSession()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <DashboardShell
      navItems={navItems(pathname)}
      userName={session?.user.name}
      userEmail={session?.user.email}
      onSignOut={handleSignOut}
      renderNavLink={({ href, className, label, icon }) => (
        <Link to={href} className={className}>
          {icon && <span className="size-4 shrink-0">{icon}</span>}
          {label}
        </Link>
      )}
      sidebarFooter={
        <FeedbackDialog>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
            Send feedback
          </Button>
        </FeedbackDialog>
      }
    >
      <Outlet />
    </DashboardShell>
  )
}

export function DashboardLayout() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
