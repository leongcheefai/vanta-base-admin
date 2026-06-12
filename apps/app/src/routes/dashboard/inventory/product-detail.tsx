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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  type CreateMovementInput,
  type MovementType,
  type UpdateProductInput,
  useCategories,
  useCreateMovement,
  useDeleteProduct,
  useMovements,
  useProduct,
  useUpdateProduct,
} from "../../../lib/inventory";

const MOVEMENT_LABELS: Record<MovementType, string> = {
  restock: "Restock",
  sale: "Sale",
  adjustment: "Adjustment",
  return: "Return",
  damage: "Damage",
  loss: "Loss",
};

function EditProductDialog({
  productId,
  onClose,
}: {
  productId: string;
  onClose: () => void;
}) {
  const { data: product } = useProduct(productId);
  const { data: categories } = useCategories();
  const update = useUpdateProduct();

  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [price, setPrice] = useState(
    product?.price ? Number.parseFloat(product.price).toString() : "",
  );
  const [description, setDescription] = useState(product?.description ?? "");
  const [reorderPoint, setReorderPoint] = useState(
    product?.reorderPoint !== null && product?.reorderPoint !== undefined
      ? String(product.reorderPoint)
      : "",
  );
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: UpdateProductInput = {
      name,
      sku,
      price: Number.parseFloat(price) || 0,
      description: description || undefined,
      reorderPoint: reorderPoint ? Number.parseInt(reorderPoint, 10) : undefined,
      categoryId: categoryId || null,
    };
    try {
      await update.mutateAsync({ id: productId, input });
      toast.success("Product updated");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update product");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="edit-name">Name</Label>
          <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="edit-sku">SKU</Label>
          <Input id="edit-sku" value={sku} onChange={(e) => setSku(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="edit-price">Price</Label>
          <Input
            id="edit-price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="edit-reorder">Reorder point</Label>
          <Input
            id="edit-reorder"
            type="number"
            min="0"
            value={reorderPoint}
            onChange={(e) => setReorderPoint(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="edit-category">Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger id="edit-category">
            <SelectValue placeholder="No category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No category</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="edit-desc">Description</Label>
        <Textarea
          id="edit-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function RecordMovementDialog({
  productId,
  onClose,
}: {
  productId: string;
  onClose: () => void;
}) {
  const createMovement = useCreateMovement(productId);
  const [type, setType] = useState<MovementType>("restock");
  const [delta, setDelta] = useState("");
  const [notes, setNotes] = useState("");
  const [reference, setReference] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedDelta = Number.parseInt(delta, 10);
    if (Number.isNaN(parsedDelta) || parsedDelta === 0) {
      toast.error("Delta must be a non-zero integer");
      return;
    }
    const input: CreateMovementInput = {
      type,
      delta: parsedDelta,
      notes: notes || undefined,
      reference: reference || undefined,
    };
    try {
      await createMovement.mutateAsync(input);
      toast.success("Movement recorded");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record movement");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="mov-type">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as MovementType)}>
            <SelectTrigger id="mov-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(MOVEMENT_LABELS) as MovementType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {MOVEMENT_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="mov-delta">Quantity (use negative for deductions)</Label>
          <Input
            id="mov-delta"
            type="number"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            required
            placeholder="e.g. 10 or -5"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="mov-ref">Reference</Label>
        <Input
          id="mov-ref"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Order number, invoice ID…"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="mov-notes">Notes</Label>
        <Textarea
          id="mov-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={createMovement.isPending}>
          {createMovement.isPending ? "Recording…" : "Record movement"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function InventoryProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(id ?? "");
  const { data: categories } = useCategories();
  const { data: movements, isLoading: movementsLoading } = useMovements(id ?? "");
  const del = useDeleteProduct();
  const [editOpen, setEditOpen] = useState(false);
  const [movOpen, setMovOpen] = useState(false);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!product) {
    return <p className="text-sm text-muted-foreground">Product not found.</p>;
  }

  const categoryName = product.categoryId
    ? (categories?.find((c) => c.id === product.categoryId)?.name ?? null)
    : null;

  const isLowStock = product.reorderPoint !== null && product.quantity <= product.reorderPoint;

  async function handleDelete() {
    if (!product) return;
    try {
      await del.mutateAsync(product.id);
      toast.success("Product deleted");
      navigate("/dashboard/inventory/products");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete product");
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard/inventory/products"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ArrowLeft size={14} />
          Products
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground font-mono">{product.sku}</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Pencil size={14} className="mr-1" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit product</DialogTitle>
              </DialogHeader>
              {editOpen && (
                <EditProductDialog productId={product.id} onClose={() => setEditOpen(false)} />
              )}
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 size={14} className="mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete product?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will hide <strong>{product.name}</strong> from your active inventory.
                  Movement history is preserved.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={del.isPending}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{product.quantity}</span>
              {isLowStock && <Badge variant="destructive">Low</Badge>}
            </div>
            {product.reorderPoint !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                Reorder at {product.reorderPoint}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Price</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {Number.parseFloat(product.price).toFixed(2)}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Category</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm">{categoryName ?? "—"}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm">{formatDate(product.updatedAt)}</span>
          </CardContent>
        </Card>
      </div>

      {product.description && (
        <div>
          <h2 className="text-sm font-medium mb-1">Description</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.description}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Movement history</h2>
        <Dialog open={movOpen} onOpenChange={setMovOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Record movement</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Record stock movement</DialogTitle>
            </DialogHeader>
            {movOpen && (
              <RecordMovementDialog productId={product.id} onClose={() => setMovOpen(false)} />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {movementsLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !movements?.length ? (
        <p className="text-sm text-muted-foreground">No movements recorded yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Delta</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((mov) => (
              <TableRow key={mov.id}>
                <TableCell className="text-sm">{formatDate(mov.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{MOVEMENT_LABELS[mov.type]}</Badge>
                </TableCell>
                <TableCell
                  className={`text-right font-mono font-medium ${
                    mov.delta > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {mov.delta > 0 ? `+${mov.delta}` : mov.delta}
                </TableCell>
                <TableCell className="text-sm">{mov.reference ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{mov.notes ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
