"use client";

import type { Region } from "@/generated/prisma/client";
import { useState, useTransition } from "react";
import { Drawer } from "@/components/admin/Drawer";
import { AdminPageHeader, FieldLabel, FormError, PrimaryButton, SecondaryButton, Select, TextInput } from "@/components/admin/AdminUi";
import { createRegionAction, deleteRegionAction, updateRegionAction } from "@/server/admin/adminActions";
import { cn } from "@/lib/utils";

interface RegionView extends Omit<Region, "supportedBusinessTypes"> {
  supportedBusinessTypes: string[];
}

interface Form {
  name: string;
  country: string;
  status: "ACTIVE" | "AVAILABLE" | "PLANNED";
  supportedBusinessTypes: string;
}

function emptyForm(): Form {
  return { name: "", country: "Kazakhstan", status: "PLANNED", supportedBusinessTypes: "" };
}

function toForm(r: RegionView): Form {
  return { name: r.name, country: r.country, status: r.status, supportedBusinessTypes: r.supportedBusinessTypes.join(", ") };
}

const STATUS_LABEL: Record<Form["status"], string> = {
  ACTIVE: "Active demo region",
  AVAILABLE: "Available configuration",
  PLANNED: "Planned",
};

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function RegionsManager({ initialRegions }: { initialRegions: RegionView[] }) {
  const [regions, setRegions] = useState(initialRegions);
  const [editing, setEditing] = useState<RegionView | null>(null);
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

  function openEdit(region: RegionView) {
    setEditing(region);
    setForm(toForm(region));
    setError(null);
    setDrawerOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input = {
      name: form.name.trim(),
      country: form.country.trim(),
      status: form.status,
      supportedBusinessTypes: splitList(form.supportedBusinessTypes),
    };
    startTransition(async () => {
      if (editing) {
        const result = await updateRegionAction(editing.id, input);
        if (!result.ok) {
          setError(result.error?.message ?? "Couldn't save this region.");
          return;
        }
        setRegions((prev) => prev.map((r) => (r.id === editing.id ? { ...r, ...input } : r)));
      } else {
        const result = await createRegionAction(input);
        if (!result.ok || !result.data) {
          setError(result.error?.message ?? "Couldn't save this region.");
          return;
        }
        setRegions((prev) =>
          [...prev, { id: result.data!.id, ...input, supplierCount: 0, createdAt: new Date(), updatedAt: new Date() }].sort((a, b) => a.name.localeCompare(b.name))
        );
      }
      setDrawerOpen(false);
    });
  }

  function handleDelete(region: RegionView) {
    if (!confirm(`Remove ${region.name}, ${region.country}?`)) return;
    startTransition(async () => {
      const result = await deleteRegionAction(region.id);
      if (result.ok) setRegions((prev) => prev.filter((r) => r.id !== region.id));
      else alert(result.error?.message ?? "Couldn't delete this region.");
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Regions"
        description="Kazakhstan today — the architecture is ready for more without claiming a deployment that doesn't exist yet."
        action={<PrimaryButton onClick={openCreate}>Add region</PrimaryButton>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {regions.map((region) => (
          <div key={region.id} className="rounded-2xl border border-black/5 p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-heading text-lg font-medium">{region.name}</p>
                <p className="text-xs text-gray-500">{region.country}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                  region.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : region.status === "AVAILABLE" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"
                )}
              >
                {STATUS_LABEL[region.status]}
              </span>
            </div>
            <p className="mt-3 text-sm text-gray-600">{region.supplierCount} supplier{region.supplierCount === 1 ? "" : "s"}</p>
            {region.supportedBusinessTypes.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">Supports: {region.supportedBusinessTypes.join(", ")}</p>
            )}
            <div className="mt-4 flex items-center gap-3 border-t border-black/5 pt-3 text-xs">
              <button type="button" onClick={() => openEdit(region)} className="font-medium text-black underline underline-offset-2">
                Edit
              </button>
              <button type="button" onClick={() => handleDelete(region)} disabled={isPending} className="text-gray-500 hover:text-red-600">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? `Edit ${editing.name}` : "Add region"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel>Region name</FieldLabel>
            <TextInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <FieldLabel>Country</FieldLabel>
            <TextInput value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} required />
          </div>
          <div>
            <FieldLabel>Status</FieldLabel>
            <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Form["status"] }))}>
              <option value="PLANNED">Planned</option>
              <option value="AVAILABLE">Available configuration</option>
              <option value="ACTIVE">Active demo region</option>
            </Select>
          </div>
          <div>
            <FieldLabel>Supported business types (comma-separated)</FieldLabel>
            <TextInput value={form.supportedBusinessTypes} onChange={(e) => setForm((f) => ({ ...f, supportedBusinessTypes: e.target.value }))} />
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
