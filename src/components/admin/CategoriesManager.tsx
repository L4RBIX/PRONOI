"use client";

import { useState, useTransition } from "react";
import { Drawer } from "@/components/admin/Drawer";
import { AdminPageHeader, FieldLabel, FormError, PrimaryButton, SecondaryButton, StatusPill, TextInput, Toggle } from "@/components/admin/AdminUi";
import { createCategoryAction, deleteCategoryAction, setCategoryActiveAction, updateCategoryAction } from "@/server/admin/adminActions";
import type { CategoryView } from "@/server/admin/categories";

interface FormState {
  name: string;
  defaultUnit: string;
  defaultShelfLifeDays: string;
  defaultServiceLevel: string;
  active: boolean;
}

function emptyForm(): FormState {
  return { name: "", defaultUnit: "", defaultShelfLifeDays: "", defaultServiceLevel: "0.95", active: true };
}

function toForm(c: CategoryView): FormState {
  return {
    name: c.name,
    defaultUnit: c.defaultUnit,
    defaultShelfLifeDays: c.defaultShelfLifeDays === null ? "" : String(c.defaultShelfLifeDays),
    defaultServiceLevel: String(c.defaultServiceLevel),
    active: c.active,
  };
}

export function CategoriesManager({ initialCategories }: { initialCategories: CategoryView[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [editing, setEditing] = useState<CategoryView | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setError(null);
    setDrawerOpen(true);
  }

  function openEdit(category: CategoryView) {
    setEditing(category);
    setForm(toForm(category));
    setError(null);
    setDrawerOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input = {
      name: form.name.trim(),
      defaultUnit: form.defaultUnit.trim(),
      defaultShelfLifeDays: form.defaultShelfLifeDays.trim() === "" ? null : Number(form.defaultShelfLifeDays),
      defaultServiceLevel: Number(form.defaultServiceLevel),
      active: form.active,
    };
    startTransition(async () => {
      const result = editing ? await updateCategoryAction(editing.id, input) : await createCategoryAction(input);
      if (!result.ok || !result.data) {
        setError(result.error?.message ?? "Couldn't save this category.");
        return;
      }
      setCategories((prev) => (editing ? prev.map((c) => (c.id === result.data!.id ? result.data! : c)) : [...prev, result.data!].sort((a, b) => a.name.localeCompare(b.name))));
      setDrawerOpen(false);
    });
  }

  function handleToggleActive(category: CategoryView) {
    startTransition(async () => {
      const result = await setCategoryActiveAction(category.id, !category.active);
      if (result.ok) setCategories((prev) => prev.map((c) => (c.id === category.id ? { ...c, active: !c.active } : c)));
    });
  }

  function handleDelete(category: CategoryView) {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteCategoryAction(category.id);
      if (result.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== category.id));
      } else {
        alert(result.error?.message ?? "Couldn't delete this category.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Product Categories"
        description="Platform-wide category catalog — defaults new products in this category inherit."
        action={<PrimaryButton onClick={openCreate}>Add category</PrimaryButton>}
      />

      <div className="overflow-x-auto rounded-2xl border border-black/5">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-xs text-gray-400">
            <tr>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Products</th>
              <th className="px-4 py-3 font-medium">Default shelf life</th>
              <th className="px-4 py-3 font-medium">Default service level</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-t border-black/5">
                <td className="px-4 py-3 font-medium text-black">{category.name}</td>
                <td className="px-4 py-3 text-gray-600">{category.productCount}</td>
                <td className="px-4 py-3 text-gray-600">{category.defaultShelfLifeDays !== null ? `${category.defaultShelfLifeDays} days` : "—"}</td>
                <td className="px-4 py-3 text-gray-600">{Math.round(category.defaultServiceLevel * 100)}%</td>
                <td className="px-4 py-3">
                  <StatusPill active={category.active} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 text-xs">
                    <button type="button" onClick={() => openEdit(category)} className="font-medium text-black underline underline-offset-2">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleToggleActive(category)} disabled={isPending} className="text-gray-500 hover:text-black">
                      {category.active ? "Disable" : "Enable"}
                    </button>
                    <button type="button" onClick={() => handleDelete(category)} disabled={isPending} className="text-gray-500 hover:text-red-600">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? `Edit ${editing.name}` : "Add category"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel>Category name</FieldLabel>
            <TextInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required disabled={Boolean(editing)} />
          </div>
          <div>
            <FieldLabel>Default unit</FieldLabel>
            <TextInput value={form.defaultUnit} onChange={(e) => setForm((f) => ({ ...f, defaultUnit: e.target.value }))} placeholder="e.g. L, kg, unit" required />
          </div>
          <div>
            <FieldLabel>Default shelf-life (days, optional)</FieldLabel>
            <TextInput
              type="number"
              min={0}
              value={form.defaultShelfLifeDays}
              onChange={(e) => setForm((f) => ({ ...f, defaultShelfLifeDays: e.target.value }))}
            />
          </div>
          <div>
            <FieldLabel>Default service level ({Math.round(Number(form.defaultServiceLevel) * 100)}%)</FieldLabel>
            <input
              type="range"
              min={0.5}
              max={0.99}
              step={0.01}
              value={form.defaultServiceLevel}
              onChange={(e) => setForm((f) => ({ ...f, defaultServiceLevel: e.target.value }))}
              className="w-full accent-black"
            />
          </div>
          <Toggle checked={form.active} onChange={(active) => setForm((f) => ({ ...f, active }))} label="Active" />
          <FormError message={error} />
          <div className="flex gap-2 pt-2">
            <PrimaryButton type="submit" disabled={isPending} className="flex-1">
              {isPending ? "Saving…" : "Save"}
            </PrimaryButton>
            <SecondaryButton type="button" onClick={() => setDrawerOpen(false)}>
              Cancel
            </SecondaryButton>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
