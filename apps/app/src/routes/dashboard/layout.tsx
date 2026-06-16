import { Button, DashboardShell, DashboardTopbar, type NavItem } from "@vanta-base-admin/ui";
import { ClipboardList, Contact, LayoutDashboard, Lock, Package, Rocket, Settings, Shield, Tag, Users } from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { FeedbackDialog } from "../../components/feedback-dialog";
import { ProtectedRoute } from "../../components/protected-route";
import { ThemeToggle } from "../../components/theme-toggle";
import { usePermissions } from "../../hooks/use-permissions";
import { signOut, useSession } from "../../lib/auth";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/settings": "Settings",
  "/dashboard/customers": "Customers",
  "/dashboard/inventory/products": "Products",
  "/dashboard/inventory/categories": "Categories",
  "/dashboard/admin/releases": "Releases",
  "/dashboard/admin/roles": "Roles",
  "/dashboard/admin/users": "Users",
  "/dashboard/admin/audit": "Audit log",
};

function navItems(
  pathname: string,
  isAdmin: boolean,
  hasPermission: (p: string) => boolean,
): NavItem[] {
  const items: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      active: pathname === "/dashboard",
      icon: <LayoutDashboard size={16} />,
      section: "Overview",
    },
  ];

  if (isAdmin || hasPermission("customers:read")) {
    items.push({
      label: "Customers",
      href: "/dashboard/customers",
      active: pathname === "/dashboard/customers",
      icon: <Contact size={16} />,
      section: "Overview",
    });
  }

  items.push(
    {
      label: "Inventory",
      icon: <Package size={16} />,
      section: "Catalog",
      children: [
        {
          label: "Products",
          href: "/dashboard/inventory/products",
          active: pathname.startsWith("/dashboard/inventory/products"),
          icon: <Package size={16} />,
        },
        {
          label: "Categories",
          href: "/dashboard/inventory/categories",
          active: pathname === "/dashboard/inventory/categories",
          icon: <Tag size={16} />,
        },
      ],
    },
  );

  const adminChildren: NavItem[] = [];

  if (isAdmin || hasPermission("roles:read")) {
    adminChildren.push({
      label: "Releases",
      href: "/dashboard/admin/releases",
      active: pathname === "/dashboard/admin/releases",
      icon: <Rocket size={16} />,
    });
  }

  if (isAdmin || hasPermission("roles:read")) {
    adminChildren.push({
      label: "Roles",
      href: "/dashboard/admin/roles",
      active: pathname === "/dashboard/admin/roles",
      icon: <Lock size={16} />,
    });
  }

  if (isAdmin || hasPermission("users:read")) {
    adminChildren.push({
      label: "Users",
      href: "/dashboard/admin/users",
      active: pathname.startsWith("/dashboard/admin/users"),
      icon: <Users size={16} />,
    });
  }

  if (isAdmin || hasPermission("audit:read")) {
    adminChildren.push({
      label: "Audit log",
      href: "/dashboard/admin/audit",
      active: pathname === "/dashboard/admin/audit",
      icon: <ClipboardList size={16} />,
    });
  }

  if (adminChildren.length > 0) {
    items.push({
      label: "Admin",
      icon: <Shield size={16} />,
      section: "Administration",
      children: adminChildren,
    });
  }

  items.push({
    label: "Settings",
    href: "/dashboard/settings",
    active: pathname === "/dashboard/settings",
    icon: <Settings size={16} />,
    section: "System",
  });

  return items;
}

function DashboardContent() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: session } = useSession();
  const { isAdmin, hasPermission } = usePermissions();

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  const items = navItems(pathname, isAdmin, hasPermission);
  const title = PAGE_TITLES[pathname] ?? "Dashboard";

  function renderNavLink({
    href,
    className,
    label,
    icon,
    isCollapsed,
  }: NavItem & { className: string; isCollapsed: boolean }) {
    return (
      <Link to={href ?? "#"} className={className}>
        {icon && <span className="size-4 shrink-0">{icon}</span>}
        {!isCollapsed && label}
      </Link>
    );
  }

  const sidebarFooter = (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <FeedbackDialog>
          <Button variant="ghost" size="sm" className="flex-1 justify-start text-muted-foreground">
            Send feedback
          </Button>
        </FeedbackDialog>
        <ThemeToggle />
      </div>
    </div>
  );

  return (
    <DashboardShell
      navItems={items}
      renderNavLink={renderNavLink}
      sidebarFooter={sidebarFooter}
      topbar={
        <DashboardTopbar
          title={title}
          navItems={items}
          userName={session?.user.name}
          userEmail={session?.user.email}
          onSignOut={handleSignOut}
          renderNavLink={renderNavLink}
          sidebarFooter={sidebarFooter}
        />
      }
    >
      <Outlet />
    </DashboardShell>
  );
}

export function DashboardLayout() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
