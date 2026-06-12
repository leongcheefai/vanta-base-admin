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
  Button,
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
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  type Category,
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "../../../lib/inventory";

function EditCategoryRow({
  category,
  onCancel,
}: {
  category: Category;
  onCancel: () => void;
}) {
  const [name, setName] = useState(category.name);
  const update = useUpdateCategory();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await update.mutateAsync({ id: category.id, input: { name } });
      onCancel();
      toast.success("Category renamed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to rename category");
    }
  }

  return (
    <TableRow>
      <TableCell colSpan={2}>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 max-w-xs"
            autoFocus
          />
          <Button type="submit" size="sm" disabled={update.isPending}>
            Save
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </form>
      </TableCell>
    </TableRow>
  );
}

function DeleteCategoryButton({ category }: { category: Category }) {
  const del = useDeleteCategory();

  async function handleDelete() {
    try {
      await del.mutateAsync(category.id);
      toast.success("Category deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete category");
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 size={14} />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete category?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{category.name}</strong>. Categories with active
            products cannot be deleted.
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
  );
}

export function InventoryCategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const create = useCreateCategory();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await create.mutateAsync({ name: newName.trim() });
      setNewName("");
      toast.success("Category created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create category");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organise your inventory into logical groups.
        </p>
      </div>

      <form onSubmit={handleCreate} className="flex items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="new-category">New category</Label>
          <Input
            id="new-category"
            placeholder="Category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-64"
          />
        </div>
        <Button type="submit" disabled={create.isPending || !newName.trim()}>
          <Plus size={16} className="mr-1" />
          Add
        </Button>
      </form>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !categories?.length ? (
        <p className="text-sm text-muted-foreground">No categories yet. Add one above.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) =>
              editingId === cat.id ? (
                <EditCategoryRow key={cat.id} category={cat} onCancel={() => setEditingId(null)} />
              ) : (
                <TableRow key={cat.id}>
                  <TableCell>{cat.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(cat.id)}>
                        <Pencil size={14} />
                      </Button>
                      <DeleteCategoryButton category={cat} />
                    </div>
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
