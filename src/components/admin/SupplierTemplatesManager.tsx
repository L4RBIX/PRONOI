"use client";

import { useState, useTransition } from "react";
import { Drawer } from "@/components/admin/Drawer";
import { AdminPageHeader, FieldLabel, FormError, PrimaryButton, SecondaryButton, Select, StatusPill, TextInput, Toggle } from "@/components/admin/AdminUi";
import {
  addSupplierProductQuoteAction,
  createSupplierAction,
  deleteSupplierAction,
  deleteSupplierProductQuoteAction,
  updateSupplierProductQuoteAction,
  updateSupplierProfileAction,
} from "@/server/admin/adminActions";
import type { SupplierTemplateRow } from "@/server/admin/supplierTemplates";

interface ProductOption {
  id: string;
  name: string;
  category: string;
  unit: string;
}

interface EditForm {
  name: string;
  region: string;
  minOrderQuantity: string;
  supplierActive: boolean;
  pricePerUnit: string;
  leadTimeDays: string;
  onTimeRate: string;
  typicalDelayDays: string;
  isActive: boolean;
}

interface CreateForm {
  id: string;
  name: string;
  region: string;
  minOrderQuantity: string;
  productId: string;
  pricePerUnit: string;
  leadTimeDays: string;
  onTimeRate: string;
  typicalDelayDays: string;
}

function toEditForm(row: SupplierTemplateRow): EditForm {
  return {
    name: row.supplierName,
    region: row.region ?? "",
    minOrderQuantity: row.minOrderQuantity === null ? "" : String(row.minOrderQuantity),
    supplierActive: row.supplierActive,
    pricePerUnit: String(row.pricePerUnit),
    leadTimeDays: String(row.leadTimeDays),
    onTimeRate: String(Math.round(row.onTimeRate * 100)),
    typicalDelayDays: String(row.typicalDelayDays),
    isActive: row.isActive,
  };
}

function emptyCreateForm(): CreateForm {
  return { id: "", name: "", region: "", minOrderQuantity: "", productId: "", pricePerUnit: "", leadTimeDays: "", onTimeRate: "95", typicalDelayDays: "1" };
}

export function SupplierTemplatesManager({ initialRows, products }: { initialRows: SupplierTemplateRow[]; products: ProductOption[] }) {
  const [rows, setRows] = useState(initialRows);
  const [editing, setEditing] = useState<SupplierTemplateRow | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreateForm());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openEdit(row: SupplierTemplateRow) {
    setEditing(row);
    setEditForm(toEditForm(row));
    setError(null);
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !editForm) return;
    setError(null);

    const profileInput = {
      name: editForm.name.trim(),
      region: editForm.region.trim() === "" ? null : editForm.region.trim(),
      minOrderQuantity: editForm.minOrderQuantity.trim() === "" ? null : Number(editForm.minOrderQuantity),
      active: editForm.supplierActive,
    };
    const quoteInput = {
      pricePerUnit: Number(editForm.pricePerUnit),
      leadTimeDays: Number(editForm.leadTimeDays),
      onTimeRate: Number(editForm.onTimeRate) / 100,
      typicalDelayDays: Number(editForm.typicalDelayDays),
      isActive: editForm.isActive,
    };

    startTransition(async () => {
      const [profileResult, quoteResult] = await Promise.all([
        updateSupplierProfileAction(editing.supplierId, profileInput),
        updateSupplierProductQuoteAction(editing.supplierProductId, quoteInput),
      ]);
      if (!profileResult.ok || !quoteResult.ok) {
        setError(profileResult.error?.message ?? quoteResult.error?.message ?? "Couldn't save these changes.");
        return;
      }
      setRows((prev) =>
        prev.map((r) =>
          r.supplierId === editing.supplierId
            ? {
                ...r,
                supplierName: profileInput.name,
                region: profileInput.region,
                minOrderQuantity: profileInput.minOrderQuantity,
                supplierActive: profileInput.active,
                ...(r.supplierProductId === editing.supplierProductId ? quoteInput : {}),
              }
            : r
        )
      );
      setEditing(null);
    });
  }

  function handleRemoveQuote(row: SupplierTemplateRow) {
    if (!confirm(`Remove ${row.supplierName}'s quote for ${row.productName}?`)) return;
    startTransition(async () => {
      const result = await deleteSupplierProductQuoteAction(row.supplierProductId);
      if (result.ok) setRows((prev) => prev.filter((r) => r.supplierProductId !== row.supplierProductId));
      else alert(result.error?.message ?? "Couldn't remove this quote.");
    });
  }

  function handleDeleteSupplier(row: SupplierTemplateRow) {
    if (!confirm(`Delete supplier "${row.supplierName}" entirely? This removes all of its product quotes.`)) return;
    startTransition(async () => {
      const result = await deleteSupplierAction(row.supplierId);
      if (result.ok) setRows((prev) => prev.filter((r) => r.supplierId !== row.supplierId));
      else alert(result.error?.message ?? "Couldn't delete this supplier.");
    });
  }

  function openCreate() {
    setCreateForm(emptyCreateForm());
    setError(null);
    setCreateOpen(true);
  }

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const existingSupplier = rows.find((r) => r.supplierId === createForm.id);
    const quote = {
      pricePerUnit: Number(createForm.pricePerUnit),
      leadTimeDays: Number(createForm.leadTimeDays),
      onTimeRate: Number(createForm.onTimeRate) / 100,
      typicalDelayDays: Number(createForm.typicalDelayDays),
      isActive: true,
    };

    startTransition(async () => {
      const result = existingSupplier
        ? await addSupplierProductQuoteAction({ supplierId: createForm.id, productId: createForm.productId, quote })
        : await createSupplierAction({
            id: createForm.id.trim(),
            name: createForm.name.trim(),
            region: createForm.region.trim() === "" ? null : createForm.region.trim(),
            minOrderQuantity: createForm.minOrderQuantity.trim() === "" ? null : Number(createForm.minOrderQuantity),
            active: true,
            productId: createForm.productId,
            quote,
          });
      if (!result.ok) {
        setError(result.error?.message ?? "Couldn't add this supplier.");
        return;
      }
      const product = products.find((p) => p.id === createForm.productId);
      setRows((prev) => [
        ...prev,
        {
          supplierProductId: `${createForm.id}-${createForm.productId}`,
          supplierId: createForm.id,
          supplierName: existingSupplier?.supplierName ?? createForm.name,
          region: existingSupplier?.region ?? (createForm.region || null),
          minOrderQuantity: existingSupplier?.minOrderQuantity ?? (createForm.minOrderQuantity ? Number(createForm.minOrderQuantity) : null),
          supplierActive: true,
          productId: createForm.productId,
          productName: product?.name ?? createForm.productId,
          category: product?.category ?? "",
          unit: product?.unit ?? "",
          ...quote,
        },
      ]);
      setCreateOpen(false);
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Suppliers"
        description="Platform supplier catalog — these are the exact prices, lead times, and reliability numbers the decision engine ranks by."
        action={<PrimaryButton onClick={openCreate}>Add supplier</PrimaryButton>}
      />

      <div className="overflow-x-auto rounded-2xl border border-black/5">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="text-left text-xs text-gray-400">
            <tr>
              <th className="px-4 py-3 font-medium">Supplier</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Region</th>
              <th className="px-4 py-3 font-medium">Lead time</th>
              <th className="px-4 py-3 font-medium">On-time %</th>
              <th className="px-4 py-3 font-medium">Min. order</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.supplierProductId} className="border-t border-black/5">
                <td className="px-4 py-3 font-medium text-black">
                  {row.supplierName}
                  <span className="ml-1.5 text-xs text-gray-400">→ {row.productName}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{row.category}</td>
                <td className="px-4 py-3 text-gray-600">{row.region ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{row.leadTimeDays}d</td>
                <td className="px-4 py-3 tabular-nums text-gray-600">{Math.round(row.onTimeRate * 100)}%</td>
                <td className="px-4 py-3 text-gray-600">{row.minOrderQuantity ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusPill active={row.supplierActive && row.isActive} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 text-xs">
                    <button type="button" onClick={() => openEdit(row)} className="font-medium text-black underline underline-offset-2">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleRemoveQuote(row)} disabled={isPending} className="text-gray-500 hover:text-black">
                      Remove quote
                    </button>
                    <button type="button" onClick={() => handleDeleteSupplier(row)} disabled={isPending} className="text-gray-500 hover:text-red-600">
                      Delete supplier
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer open={Boolean(editing)} onClose={() => setEditing(null)} title={editing ? `${editing.supplierName} — ${editing.productName}` : ""}>
        {editing && editForm && (
          <form onSubmit={handleEditSubmit} className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-gray-400 uppercase">Supplier profile</p>
              <div className="space-y-3">
                <div>
                  <FieldLabel>Name</FieldLabel>
                  <TextInput value={editForm.name} onChange={(e) => setEditForm((f) => f && { ...f, name: e.target.value })} required />
                </div>
                <div>
                  <FieldLabel>Region</FieldLabel>
                  <TextInput value={editForm.region} onChange={(e) => setEditForm((f) => f && { ...f, region: e.target.value })} placeholder="e.g. Almaty" />
                </div>
                <div>
                  <FieldLabel>Minimum order quantity</FieldLabel>
                  <TextInput
                    type="number"
                    min={0}
                    value={editForm.minOrderQuantity}
                    onChange={(e) => setEditForm((f) => f && { ...f, minOrderQuantity: e.target.value })}
                  />
                </div>
                <Toggle checked={editForm.supplierActive} onChange={(v) => setEditForm((f) => f && { ...f, supplierActive: v })} label="Supplier active" />
              </div>
            </div>

            <div className="border-t border-black/5 pt-4">
              <p className="mb-2 text-xs font-medium tracking-wide text-gray-400 uppercase">
                Quote for {editing.productName} <span className="normal-case text-gray-400">(feeds the real decision engine)</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Price / {editing.unit}</FieldLabel>
                  <TextInput type="number" min={0} value={editForm.pricePerUnit} onChange={(e) => setEditForm((f) => f && { ...f, pricePerUnit: e.target.value })} required />
                </div>
                <div>
                  <FieldLabel>Lead time (days)</FieldLabel>
                  <TextInput type="number" min={0} value={editForm.leadTimeDays} onChange={(e) => setEditForm((f) => f && { ...f, leadTimeDays: e.target.value })} required />
                </div>
                <div>
                  <FieldLabel>On-time rate (%)</FieldLabel>
                  <TextInput
                    type="number"
                    min={0}
                    max={100}
                    value={editForm.onTimeRate}
                    onChange={(e) => setEditForm((f) => f && { ...f, onTimeRate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <FieldLabel>Typical delay (days)</FieldLabel>
                  <TextInput
                    type="number"
                    min={0}
                    value={editForm.typicalDelayDays}
                    onChange={(e) => setEditForm((f) => f && { ...f, typicalDelayDays: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="mt-3">
                <Toggle checked={editForm.isActive} onChange={(v) => setEditForm((f) => f && { ...f, isActive: v })} label="Quote active (considered by the decision engine)" />
              </div>
            </div>

            <FormError message={error} />
            <div className="flex gap-2 pt-1">
              <PrimaryButton type="submit" disabled={isPending} className="flex-1">
                {isPending ? "Saving…" : "Save"}
              </PrimaryButton>
              <SecondaryButton type="button" onClick={() => setEditing(null)}>
                Cancel
              </SecondaryButton>
            </div>
          </form>
        )}
      </Drawer>

      <Drawer open={createOpen} onClose={() => setCreateOpen(false)} title="Add supplier" description="Assigns a supplier to quote a specific product.">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <FieldLabel>Supplier id (lowercase, hyphenated)</FieldLabel>
            <TextInput value={createForm.id} onChange={(e) => setCreateForm((f) => ({ ...f, id: e.target.value }))} placeholder="e.g. supplier-d" required />
          </div>
          <div>
            <FieldLabel>Supplier name</FieldLabel>
            <TextInput value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <FieldLabel>Region</FieldLabel>
            <TextInput value={createForm.region} onChange={(e) => setCreateForm((f) => ({ ...f, region: e.target.value }))} placeholder="e.g. Almaty" />
          </div>
          <div>
            <FieldLabel>Minimum order quantity</FieldLabel>
            <TextInput type="number" min={0} value={createForm.minOrderQuantity} onChange={(e) => setCreateForm((f) => ({ ...f, minOrderQuantity: e.target.value }))} />
          </div>
          <div>
            <FieldLabel>Product to quote</FieldLabel>
            <Select value={createForm.productId} onChange={(e) => setCreateForm((f) => ({ ...f, productId: e.target.value }))} required>
              <option value="" disabled>
                Select a product…
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category})
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Price / unit</FieldLabel>
              <TextInput type="number" min={0} value={createForm.pricePerUnit} onChange={(e) => setCreateForm((f) => ({ ...f, pricePerUnit: e.target.value }))} required />
            </div>
            <div>
              <FieldLabel>Lead time (days)</FieldLabel>
              <TextInput type="number" min={0} value={createForm.leadTimeDays} onChange={(e) => setCreateForm((f) => ({ ...f, leadTimeDays: e.target.value }))} required />
            </div>
            <div>
              <FieldLabel>On-time rate (%)</FieldLabel>
              <TextInput type="number" min={0} max={100} value={createForm.onTimeRate} onChange={(e) => setCreateForm((f) => ({ ...f, onTimeRate: e.target.value }))} required />
            </div>
            <div>
              <FieldLabel>Typical delay (days)</FieldLabel>
              <TextInput type="number" min={0} value={createForm.typicalDelayDays} onChange={(e) => setCreateForm((f) => ({ ...f, typicalDelayDays: e.target.value }))} required />
            </div>
          </div>
          <FormError message={error} />
          <div className="flex gap-2 pt-2">
            <PrimaryButton type="submit" disabled={isPending} className="flex-1">
              {isPending ? "Saving…" : "Add"}
            </PrimaryButton>
            <SecondaryButton type="button" onClick={() => setCreateOpen(false)}>
              Cancel
            </SecondaryButton>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
