import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { ChevronLeft, ChevronRight, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { usePermissions } from "../../../hooks/use-permissions";
import type { CreateCustomerInput, Customer, CustomerStatus, UpdateCustomerInput } from "../../../lib/customers";
import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from "../../../lib/customers";

const PAGE_SIZE = 20;

function CustomerForm({
  initial,
  onSubmit,
  isPending,
  submitLabel,
}: {
  initial?: Partial<Customer>;
  onSubmit: (input: CreateCustomerInput | UpdateCustomerInput) => Promise<void>;
  isPending: boolean;
  submitLabel: string;
}) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [status, setStatus] = useState<CustomerStatus>(initial?.status ?? "active");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() && !lastName.trim() && !company.trim()) {
      toast.error("At least one of first name, last name, or company is required");
      return;
    }
    await onSubmit({
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      email: email || undefined,
      phone: phone || undefined,
      company: company || undefined,
      notes: notes || undefined,
      status,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="cust-first">First name</Label>
          <Input
            id="cust-first"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cust-last">Last name</Label>
          <Input
            id="cust-last"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="cust-company">Company</Label>
        <Input
          id="cust-company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Required if no name provided"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="cust-email">Email</Label>
          <Input
            id="cust-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cust-phone">Phone</Label>
          <Input
            id="cust-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="cust-status">Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as CustomerStatus)}>
          <SelectTrigger id="cust-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="cust-notes">Notes</Label>
        <Textarea
          id="cust-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

function EditCustomerDialog({
  customer,
  open,
  onOpenChange,
}: {
  customer: Customer;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const update = useUpdateCustomer();

  async function handleSubmit(input: UpdateCustomerInput) {
    try {
      await update.mutateAsync({ id: customer.id, input });
      toast.success("Customer updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update customer");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit customer</DialogTitle>
        </DialogHeader>
        <CustomerForm
          initial={customer}
          onSubmit={handleSubmit}
          isPending={update.isPending}
          submitLabel="Save changes"
        />
      </DialogContent>
    </Dialog>
  );
}

function DeleteCustomerDialog({
  customer,
  open,
  onOpenChange,
}: {
  customer: Customer;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const del = useDeleteCustomer();

  async function handleDelete() {
    try {
      await del.mutateAsync(customer.id);
      toast.success("Customer deleted");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete customer");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete customer</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <strong>{customer.name}</strong>? This cannot be
          undone from the UI.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={del.isPending}>
            {del.isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CustomerRow({ customer }: { customer: Customer }) {
  const { hasPermission, isAdmin } = usePermissions();
  const canEdit = isAdmin || hasPermission("customers:edit");
  const canDelete = isAdmin || hasPermission("customers:delete");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <TableRow
        className={canEdit ? "cursor-pointer hover:bg-muted/50" : undefined}
        onClick={canEdit ? () => setEditOpen(true) : undefined}
      >
        <TableCell className="font-medium">{customer.name}</TableCell>
        <TableCell>{customer.company ?? <span className="text-muted-foreground">—</span>}</TableCell>
        <TableCell>{customer.email ?? <span className="text-muted-foreground">—</span>}</TableCell>
        <TableCell>{customer.phone ?? <span className="text-muted-foreground">—</span>}</TableCell>
        <TableCell>
          {customer.status === "active" ? (
            <Badge variant="outline">Active</Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </TableCell>
        <TableCell>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteOpen(true);
              }}
            >
              <Trash2 size={14} />
            </Button>
          )}
        </TableCell>
      </TableRow>
      {canEdit && (
        <EditCustomerDialog customer={customer} open={editOpen} onOpenChange={setEditOpen} />
      )}
      {canDelete && (
        <DeleteCustomerDialog
          customer={customer}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </>
  );
}

export function CustomersPage() {
  const { hasPermission, isAdmin } = usePermissions();
  const canCreate = isAdmin || hasPermission("customers:create");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "">("");
  const [createOpen, setCreateOpen] = useState(false);
  const create = useCreateCustomer();

  const { data, isLoading } = useCustomers({
    page,
    limit: PAGE_SIZE,
    q: search || undefined,
    status: statusFilter || undefined,
  });

  const customers = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value === "__all__" ? "" : (value as CustomerStatus));
    setPage(1);
  }

  async function handleCreate(input: CreateCustomerInput) {
    try {
      await create.mutateAsync(input);
      toast.success("Customer created");
      setCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create customer");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Shared contact directory for the business.
          </p>
        </div>
        {canCreate && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={16} className="mr-1" />
                New customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create customer</DialogTitle>
              </DialogHeader>
              <CustomerForm
                onSubmit={handleCreate}
                isPending={create.isPending}
                submitLabel="Create customer"
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search name, email, company…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 w-64"
          />
        </div>
        <Select value={statusFilter || "__all__"} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !customers.length ? (
        <p className="text-sm text-muted-foreground">No customers found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <CustomerRow key={customer.id} customer={customer} />
            ))}
          </TableBody>
        </Table>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
