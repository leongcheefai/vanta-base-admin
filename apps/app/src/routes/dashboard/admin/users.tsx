import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  toast,
} from "@vanta-base-admin/ui";
import { ChevronLeft, ChevronRight, MoreHorizontal, Search, UserPlus } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router";
import { useRoles } from "../../../lib/roles";
import {
  type AdminUser,
  useAssignUserRole,
  useBanUser,
  useCreateUser,
  useDeleteUser,
  useEditUser,
  useRestoreUser,
  useUnbanUser,
  useUsers,
} from "../../../lib/users";

const PAGE_SIZE = 20;

function userStatusBadge(user: AdminUser) {
  if (user.deletedAt) return <Badge variant="destructive">Deleted</Badge>;
  if (user.banned) return <Badge variant="secondary">Banned</Badge>;
  return <Badge variant="outline">Active</Badge>;
}

function CreateUserDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const create = useCreateUser();
  const { data: roles } = useRoles();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create.mutateAsync({ name, email, password, roleId: roleId || undefined });
      toast.success("User created");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select value={roleId} onValueChange={setRoleId}>
          <SelectTrigger>
            <SelectValue placeholder="Default (user)" />
          </SelectTrigger>
          <SelectContent>
            {roles?.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Creating…" : "Create user"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function EditUserDialog({
  user,
  onClose,
}: {
  user: AdminUser;
  onClose: () => void;
}) {
  const [name, setName] = useState(user.name);
  const edit = useEditUser();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await edit.mutateAsync({ id: user.id, input: { name } });
      toast.success("User updated");
      onClose();
    } catch {
      toast.error("Failed to update user");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">Name</Label>
        <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={edit.isPending}>
          {edit.isPending ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function AssignRoleDialog({
  user,
  onClose,
}: {
  user: AdminUser;
  onClose: () => void;
}) {
  const [roleId, setRoleId] = useState(user.roleId ?? "");
  const assign = useAssignUserRole();
  const { data: roles } = useRoles();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await assign.mutateAsync({ id: user.id, roleId });
      toast.success("Role assigned");
      onClose();
    } catch {
      toast.error("Failed to assign role");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="assign-role">Role</Label>
        <Select value={roleId} onValueChange={setRoleId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {roles?.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={assign.isPending || !roleId}>
          {assign.isPending ? "Assigning…" : "Assign role"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function BanUserDialog({
  user,
  onClose,
}: {
  user: AdminUser;
  onClose: () => void;
}) {
  const [banReason, setBanReason] = useState("");
  const ban = useBanUser();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await ban.mutateAsync({ id: user.id, banReason });
      toast.success("User banned");
      onClose();
    } catch {
      toast.error("Failed to ban user");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Banning <strong>{user.email}</strong> will immediately block all access.
      </p>
      <div className="space-y-2">
        <Label htmlFor="ban-reason">Reason (required)</Label>
        <Textarea
          id="ban-reason"
          value={banReason}
          onChange={(e) => setBanReason(e.target.value)}
          rows={3}
          required
          minLength={1}
        />
      </div>
      <DialogFooter>
        <Button type="submit" variant="destructive" disabled={ban.isPending}>
          {ban.isPending ? "Banning…" : "Ban user"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function UserRowActions({ user }: { user: AdminUser }) {
  const [editOpen, setEditOpen] = useState(false);
  const [assignRoleOpen, setAssignRoleOpen] = useState(false);
  const [banOpen, setBanOpen] = useState(false);
  const unban = useUnbanUser();
  const deleteUser = useDeleteUser();
  const restore = useRestoreUser();

  async function handleUnban() {
    try {
      await unban.mutateAsync(user.id);
      toast.success("User unbanned");
    } catch {
      toast.error("Failed to unban user");
    }
  }

  async function handleDelete() {
    try {
      await deleteUser.mutateAsync(user.id);
      toast.success("User deleted");
    } catch {
      toast.error("Failed to delete user");
    }
  }

  async function handleRestore() {
    try {
      await restore.mutateAsync(user.id);
      toast.success("User restored");
    } catch {
      toast.error("Failed to restore user");
    }
  }

  return (
    <>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>Update {user.email}&apos;s name.</DialogDescription>
          </DialogHeader>
          <EditUserDialog user={user} onClose={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={assignRoleOpen} onOpenChange={setAssignRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign role</DialogTitle>
            <DialogDescription>Change {user.email}&apos;s access role.</DialogDescription>
          </DialogHeader>
          <AssignRoleDialog user={user} onClose={() => setAssignRoleOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={banOpen} onOpenChange={setBanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban user</DialogTitle>
            <DialogDescription>Provide a reason for banning this account.</DialogDescription>
          </DialogHeader>
          <BanUserDialog user={user} onClose={() => setBanOpen(false)} />
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="size-8 p-0">
            <MoreHorizontal size={14} />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to={`/dashboard/admin/users/${user.id}`}>View detail</Link>
          </DropdownMenuItem>
          {!user.deletedAt && (
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>Edit name</DropdownMenuItem>
          )}
          {!user.deletedAt && (
            <DropdownMenuItem onSelect={() => setAssignRoleOpen(true)}>
              Assign role
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {!user.deletedAt && !user.banned && (
            <DropdownMenuItem onSelect={() => setBanOpen(true)}>Ban</DropdownMenuItem>
          )}
          {!user.deletedAt && user.banned && (
            <DropdownMenuItem onSelect={handleUnban}>Unban</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {!user.deletedAt ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete user?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will soft-delete {user.email} and revoke all active sessions. The account
                    can be restored later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <DropdownMenuItem onSelect={handleRestore}>Restore</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [banned, setBanned] = useState<"all" | "banned" | "active">("all");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { data: roles } = useRoles();

  const params = {
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    search: debouncedSearch || undefined,
    role: roleFilter === "all" ? undefined : roleFilter,
    banned: banned === "all" ? undefined : banned === "banned",
    includeDeleted,
  };

  const { data, isLoading } = useUsers(params);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearch(value);
    setPage(0);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  }

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage registered user accounts.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <UserPlus size={14} />
              Create user
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create user</DialogTitle>
              <DialogDescription>Add a new user account directly.</DialogDescription>
            </DialogHeader>
            <CreateUserDialog onClose={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-48 flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search name or email…"
            value={search}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => {
            setRoleFilter(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {roles?.map((r) => (
              <SelectItem key={r.slug} value={r.slug}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={banned}
          onValueChange={(v) => {
            setBanned(v as "all" | "banned" | "active");
            setPage(0);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={includeDeleted ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setIncludeDeleted((v) => !v);
            setPage(0);
          }}
          className="h-9"
        >
          {includeDeleted ? "Hiding deleted" : "Show deleted"}
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading users…</p>}

      {!isLoading && data && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
                {data.users.map((user) => (
                  <TableRow key={user.id} className={user.deletedAt ? "opacity-50" : undefined}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarImage src={user.image ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <Link
                            to={`/dashboard/admin/users/${user.id}`}
                            className="truncate text-sm font-medium hover:underline"
                          >
                            {user.name}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {user.role ?? "user"}
                      </Badge>
                    </TableCell>
                    <TableCell>{userStatusBadge(user)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <UserRowActions user={user} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {data.total} total user{data.total !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
              >
                <ChevronLeft size={14} />
              </Button>
              <span className="text-sm text-muted-foreground">
                {page + 1} / {Math.max(1, totalPages)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
