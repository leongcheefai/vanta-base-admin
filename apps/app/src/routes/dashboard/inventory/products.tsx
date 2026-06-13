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
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  toast,
} from "@vanta-base-admin/ui";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import {
  type CreateProductInput,
  useCategories,
  useCreateProduct,
  useProducts,
} from "../../../lib/inventory";

const PAGE_SIZE = 20;

function CreateProductDialog({ onClose }: { onClose: () => void }) {
  const { data: categories } = useCategories();
  const create = useCreateProduct();

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [reorderPoint, setReorderPoint] = useState("");
  const [categoryId, setCategoryId] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: CreateProductInput = {
      name,
      sku,
      price: Number.parseFloat(price) || 0,
      description: description || undefined,
      reorderPoint: reorderPoint ? Number.parseInt(reorderPoint, 10) : undefined,
      categoryId: categoryId || undefined,
    };
    try {
      await create.mutateAsync(input);
      toast.success("Product created");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create product");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="prod-name">Name *</Label>
          <Input id="prod-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="prod-sku">SKU *</Label>
          <Input id="prod-sku" value={sku} onChange={(e) => setSku(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="prod-price">Price *</Label>
          <Input
            id="prod-price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="prod-reorder">Reorder point</Label>
          <Input
            id="prod-reorder"
            type="number"
            min="0"
            value={reorderPoint}
            onChange={(e) => setReorderPoint(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="prod-category">Category</Label>
        <Select
          value={categoryId || "__none__"}
          onValueChange={(v) => setCategoryId(v === "__none__" ? "" : v)}
        >
          <SelectTrigger id="prod-category">
            <SelectValue placeholder="No category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No category</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="prod-desc">Description</Label>
        <Textarea
          id="prod-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Creating…" : "Create product"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function InventoryProductsPage() {
  const { data: categories } = useCategories();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [lowStock, setLowStock] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useProducts({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    categoryId: categoryId || undefined,
    lowStock: lowStock || undefined,
  });

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleCategoryChange(value: string) {
    setCategoryId(value === "__all__" ? "" : value);
    setPage(1);
  }

  function handleLowStockToggle(checked: boolean) {
    setLowStock(checked);
    setPage(1);
  }

  function isLowStock(product: { quantity: number; reorderPoint: number | null }) {
    return product.reorderPoint !== null && product.quantity <= product.reorderPoint;
  }

  function getCategoryName(catId: string | null) {
    if (!catId) return null;
    return categories?.find((c) => c.id === catId)?.name ?? null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your product inventory.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-1" />
              New product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create product</DialogTitle>
            </DialogHeader>
            <CreateProductDialog onClose={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search name or SKU…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 w-64"
          />
        </div>

        <Select value={categoryId || "__all__"} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All categories</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 text-sm">
          <Switch id="low-stock" checked={lowStock} onCheckedChange={handleLowStockToggle} />
          <Label htmlFor="low-stock">Low stock only</Label>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !products.length ? (
        <p className="text-sm text-muted-foreground">No products found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Link
                    to={`/dashboard/inventory/products/${product.id}`}
                    className="font-medium hover:underline"
                  >
                    {product.name}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                <TableCell>
                  {getCategoryName(product.categoryId) ?? (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {Number.parseFloat(product.price).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">{product.quantity}</TableCell>
                <TableCell>
                  {isLowStock(product) ? (
                    <Badge variant="destructive">Low stock</Badge>
                  ) : (
                    <Badge variant="outline">In stock</Badge>
                  )}
                </TableCell>
              </TableRow>
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
