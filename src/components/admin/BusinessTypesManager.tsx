"use client";

import { useState, useTransition } from "react";
import { Drawer } from "@/components/admin/Drawer";
import { AdminPageHeader, FieldLabel, FormError, PrimaryButton, SecondaryButton, TextArea, TextInput } from "@/components/admin/AdminUi";
import { createBusinessTypeAction, deleteBusinessTypeAction, updateBusinessTypeAction } from "@/server/admin/adminActions";
import type { BusinessTypeView } from "@/server/admin/businessTypes";

interface Form {
  name: string;
  description: string;
  recommendedTools: string;
  defaultCategories: string;
  seasonalityProfile: string;
}

function emptyForm(): Form {
  return { name: "", description: "", recommendedTools: "", defaultCategories: "", seasonalityProfile: "" };
}

function toForm(t: BusinessTypeView): Form {
  return {
    name: t.name,
    description: t.description ?? "",
    recommendedTools: t.recommendedTools.join(", "),
    defaultCategories: t.defaultCategories.join(", "),
    seasonalityProfile: t.seasonalityProfile ?? "",
  };
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function BusinessTypesManager({ initialTypes }: { initialTypes: BusinessTypeView[] }) {
  const [types, setTypes] = useState(initialTypes);
  const [editing, setEditing] = useState<BusinessTypeView | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setError(null);
    setDrawerOpen(true);
  }

  function openEdit(type: BusinessTypeView) {
    setEditing(type);
    setForm(toForm(type));
    setError(null);
    setDrawerOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input = {
      name: form.name.trim(),
      description: form.description.trim() === "" ? null : form.description.trim(),
      recommendedTools: splitList(form.recommendedTools),
      defaultCategories: splitList(form.defaultCategories),
      seasonalityProfile: form.seasonalityProfile.trim() === "" ? null : form.seasonalityProfile.trim(),
    };
    startTransition(async () => {
      if (editing) {
        const result = await updateBusinessTypeAction(editing.id, input);
        if (!result.ok) {
          setError(result.error?.message ?? "Couldn't save this business type.");
          return;
        }
        setTypes((prev) => prev.map((t) => (t.id === editing.id ? { ...t, ...input } : t)));
      } else {
        const result = await createBusinessTypeAction(input);
        if (!result.ok || !result.data) {
          setError(result.error?.message ?? "Couldn't save this business type.");
          return;
        }
        setTypes((prev) => [...prev, { id: result.data!.id, ...input, businessCount: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setDrawerOpen(false);
    });
  }

  function handleDelete(type: BusinessTypeView) {
    if (!confirm(`Delete business type "${type.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteBusinessTypeAction(type.id);
      if (result.ok) setTypes((prev) => prev.filter((t) => t.id !== type.id));
      else alert(result.error?.message ?? "Couldn't delete this business type.");
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Business Types"
        description="Default toolset and category recommendations by business profile — what a new business of this type should start with."
        action={<PrimaryButton onClick={openCreate}>Add business type</PrimaryButton>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {types.map((type) => (
          <div key={type.id} className="flex flex-col rounded-2xl border border-black/5 p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="font-heading text-lg font-medium">{type.name}</p>
              <span className="shrink-0 text-xs text-gray-400">{type.businessCount} business{type.businessCount === 1 ? "" : "es"}</span>
            </div>
            {type.description && <p className="mt-1 text-sm text-gray-500">{type.description}</p>}

            {type.recommendedTools.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">Recommended</p>
                <ul className="mt-1.5 space-y-1 text-sm text-gray-700">
                  {type.recommendedTools.map((tool) => (
                    <li key={tool}>— {tool}</li>
                  ))}
                </ul>
              </div>
            )}

            {type.defaultCategories.length > 0 && (
              <p className="mt-3 text-xs text-gray-500">Categories: {type.defaultCategories.join(", ")}</p>
            )}
            {type.seasonalityProfile && <p className="mt-1 text-xs text-gray-500">{type.seasonalityProfile}</p>}

            <div className="mt-4 flex items-center gap-3 border-t border-black/5 pt-3 text-xs">
              <button type="button" onClick={() => openEdit(type)} className="font-medium text-black underline underline-offset-2">
                Edit
              </button>
              <button type="button" onClick={() => handleDelete(type)} disabled={isPending} className="text-gray-500 hover:text-red-600">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? `Edit ${editing.name}` : "Add business type"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel>Name</FieldLabel>
            <TextInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required disabled={Boolean(editing)} />
          </div>
          <div>
            <FieldLabel>Description</FieldLabel>
            <TextArea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <FieldLabel>Recommended tools (comma-separated)</FieldLabel>
            <TextArea rows={2} value={form.recommendedTools} onChange={(e) => setForm((f) => ({ ...f, recommendedTools: e.target.value }))} />
          </div>
          <div>
            <FieldLabel>Default categories (comma-separated)</FieldLabel>
            <TextInput value={form.defaultCategories} onChange={(e) => setForm((f) => ({ ...f, defaultCategories: e.target.value }))} />
          </div>
          <div>
            <FieldLabel>Seasonality profile</FieldLabel>
            <TextArea rows={2} value={form.seasonalityProfile} onChange={(e) => setForm((f) => ({ ...f, seasonalityProfile: e.target.value }))} />
          </div>
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
