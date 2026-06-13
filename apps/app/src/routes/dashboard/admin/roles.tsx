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
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from "@vanta-base-admin/ui";
import { Lock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  type Role,
  useCreateRole,
  useDeleteRole,
  useRoles,
  useUpdateRole,
} from "../../../lib/roles";

const ALL_PERMISSIONS = [
  { key: "users:read", label: "Users — view list & details" },
  { key: "users:create", label: "Users — create" },
  { key: "users:edit", label: "Users — edit name" },
  { key: "users:delete", label: "Users — delete & restore" },
  { key: "users:ban", label: "Users — ban & unban" },
  { key: "users:sessions", label: "Users — revoke sessions" },
  { key: "roles:read", label: "Roles — view" },
  { key: "roles:write", label: "Roles — create, edit & delete" },
  { key: "roles:assign", label: "Roles — assign to users" },
] as const;

function CreateRoleDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const create = useCreateRole();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create.mutateAsync({ name, permissions: [] });
      toast.success("Role created");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create role");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="role-name">Name</Label>
        <Input
          id="role-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Moderator"
          required
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Creating…" : "Create role"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function RolePermissionsPanel({ role }: { role: Role }) {
  const update = useUpdateRole();
  const isAdmin = role.slug === "admin";

  async function togglePermission(permission: string) {
    if (isAdmin) return;
    const current = new Set(role.permissions);
    if (current.has(permission)) {
      current.delete(permission);
    } else {
      current.add(permission);
    }
    try {
      await update.mutateAsync({
        id: role.id,
        input: { permissions: Array.from(current) },
      });
    } catch {
      toast.error("Failed to update permissions");
    }
  }

  async function handleNameChange(name: string) {
    if (!name.trim()) return;
    try {
      await update.mutateAsync({ id: role.id, input: { name } });
      toast.success("Role name updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to rename role");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <RoleNameEdit role={role} onSave={handleNameChange} />
        {role.isSystem && (
          <Badge variant="outline" className="gap-1 text-xs">
            <Lock size={10} />
            System
          </Badge>
        )}
      </div>

      {isAdmin ? (
        <p className="text-sm text-muted-foreground">
          The admin role has unrestricted access to all features and cannot have its permissions
          modified.
        </p>
      ) : (
        <div className="space-y-2">
          {ALL_PERMISSIONS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <Checkbox
                id={`${role.id}-${key}`}
                checked={role.permissions.includes(key)}
                onCheckedChange={() => togglePermission(key)}
                disabled={update.isPending}
              />
              <Label htmlFor={`${role.id}-${key}`} className="cursor-pointer text-sm font-normal">
                {label}
              </Label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RoleNameEdit({
  role,
  onSave,
}: {
  role: Role;
  onSave: (name: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(role.name);
  const isNameLocked = role.slug === "admin";

  if (isNameLocked || !editing) {
    return (
      <button
        type="button"
        className="text-sm font-medium hover:underline disabled:cursor-default disabled:no-underline"
        onClick={() => !isNameLocked && setEditing(true)}
        disabled={isNameLocked}
        title={isNameLocked ? undefined : "Click to rename"}
      >
        {role.name}
      </button>
    );
  }

  async function handleSave() {
    if (value.trim() && value !== role.name) {
      await onSave(value.trim());
    }
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-7 text-sm"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") {
            setValue(role.name);
            setEditing(false);
          }
        }}
      />
      <Button size="sm" className="h-7 px-2 text-xs" onClick={handleSave}>
        Save
      </Button>
    </div>
  );
}

export function AdminRolesPage() {
  const { data: roles, isLoading } = useRoles();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const deleteRole = useDeleteRole();

  const selectedRole = roles?.find((r) => r.id === selectedId) ?? roles?.[0];

  async function handleDelete(role: Role) {
    try {
      await deleteRole.mutateAsync(role.id);
      toast.success(`Role "${role.name}" deleted`);
      if (selectedId === role.id) setSelectedId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete role");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define roles and assign permissions to control access.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus size={14} />
              New role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create role</DialogTitle>
              <DialogDescription>
                Add a new role. You can assign permissions after creation.
              </DialogDescription>
            </DialogHeader>
            <CreateRoleDialog onClose={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading roles…</p>}

      {!isLoading && roles && (
        <div className="flex gap-6">
          <div className="w-56 shrink-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow
                      key={role.id}
                      className={`cursor-pointer ${selectedRole?.id === role.id ? "bg-muted/50" : ""}`}
                      onClick={() => setSelectedId(role.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{role.name}</span>
                          {role.isSystem && <Lock size={12} className="text-muted-foreground" />}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {role.slug === "admin"
                            ? "All permissions"
                            : role.permissions.length === 0
                              ? "No permissions"
                              : `${role.permissions.length} permission${role.permissions.length !== 1 ? "s" : ""}`}
                        </p>
                      </TableCell>
                      <TableCell>
                        {!role.isSystem && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="size-7 p-0 text-destructive hover:text-destructive"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete &quot;{role.name}&quot;?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the role. Users assigned this role
                                  will keep their current access until their role is changed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(role)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {selectedRole && (
            <div className="flex-1 rounded-md border p-4">
              <RolePermissionsPanel role={selectedRole} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
