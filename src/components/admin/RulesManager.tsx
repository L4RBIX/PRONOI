"use client";

import type { AutoOrderRule } from "@/generated/prisma/client";
import { useState, useTransition } from "react";
import { Drawer } from "@/components/admin/Drawer";
import { AdminPageHeader, FieldLabel, FormError, PrimaryButton, SecondaryButton, Select, StatusPill, TextInput, Toggle } from "@/components/admin/AdminUi";
import { createRuleAction, deleteRuleAction, setRuleActiveAction, updateRuleAction } from "@/server/admin/adminActions";

interface RuleForm {
  name: string;
  businessType: string; // "" = all
  category: string;
  stockoutRiskThreshold: string;
  minRunwayDays: string;
  targetServiceLevel: string;
  reorderHorizonDays: string;
  approvalRequired: boolean;
  active: boolean;
}

function emptyForm(defaultCategory: string): RuleForm {
  return {
    name: "",
    businessType: "",
    category: defaultCategory,
    stockoutRiskThreshold: "70",
    minRunwayDays: "3",
    targetServiceLevel: "95",
    reorderHorizonDays: "1",
    approvalRequired: true,
    active: true,
  };
}

function toForm(rule: AutoOrderRule): RuleForm {
  return {
    name: rule.name,
    businessType: rule.businessType ?? "",
    category: rule.category,
    stockoutRiskThreshold: String(Math.round(rule.stockoutRiskThreshold * 100)),
    minRunwayDays: rule.minRunwayDays === null ? "" : String(rule.minRunwayDays),
    targetServiceLevel: String(Math.round(rule.targetServiceLevel * 100)),
    reorderHorizonDays: String(rule.reorderHorizonDays),
    approvalRequired: rule.approvalRequired,
    active: rule.active,
  };
}

export function RulesManager({
  initialRules,
  businessTypeNames,
  categoryNames,
}: {
  initialRules: AutoOrderRule[];
  businessTypeNames: string[];
  categoryNames: string[];
}) {
  const [rules, setRules] = useState(initialRules);
  const [editing, setEditing] = useState<AutoOrderRule | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<RuleForm>(emptyForm(categoryNames[0] ?? ""));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setForm(emptyForm(categoryNames[0] ?? ""));
    setError(null);
    setDrawerOpen(true);
  }

  function openEdit(rule: AutoOrderRule) {
    setEditing(rule);
    setForm(toForm(rule));
    setError(null);
    setDrawerOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input = {
      name: form.name.trim(),
      businessType: form.businessType === "" ? null : form.businessType,
      category: form.category,
      stockoutRiskThreshold: Number(form.stockoutRiskThreshold) / 100,
      minRunwayDays: form.minRunwayDays.trim() === "" ? null : Number(form.minRunwayDays),
      targetServiceLevel: Number(form.targetServiceLevel) / 100,
      reorderHorizonDays: Number(form.reorderHorizonDays),
      approvalRequired: form.approvalRequired,
      active: form.active,
    };
    startTransition(async () => {
      const result = editing ? await updateRuleAction(editing.id, input) : await createRuleAction(input);
      if (!result.ok) {
        setError(result.error?.message ?? "Couldn't save this rule.");
        return;
      }
      if (editing) {
        setRules((prev) => prev.map((r) => (r.id === editing.id ? { ...r, ...input } : r)));
      } else {
        setRules((prev) => [...prev, { id: result.data!.id, ...input, createdAt: new Date(), updatedAt: new Date() } as AutoOrderRule]);
      }
      setDrawerOpen(false);
    });
  }

  function handleToggleActive(rule: AutoOrderRule) {
    startTransition(async () => {
      const result = await setRuleActiveAction(rule.id, !rule.active);
      if (result.ok) setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, active: !r.active } : r)));
    });
  }

  function handleDelete(rule: AutoOrderRule) {
    if (!confirm(`Delete rule "${rule.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteRuleAction(rule.id);
      if (result.ok) setRules((prev) => prev.filter((r) => r.id !== rule.id));
      else alert(result.error?.message ?? "Couldn't delete this rule.");
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Auto-order Rules"
        description="Reorder policy per business type × category. Target service level feeds directly into the real safety-stock calculation."
        action={<PrimaryButton onClick={openCreate}>Create rule</PrimaryButton>}
      />

      {rules.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-500">No rules yet.</p>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="rounded-2xl border border-black/5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-heading text-lg font-medium">{rule.name}</p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {rule.businessType ?? "All business types"} · {rule.category}
                  </p>
                </div>
                <StatusPill active={rule.active} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-black/5 pt-4 text-sm sm:grid-cols-4">
                <div>
                  <p className="font-medium text-black">{Math.round(rule.stockoutRiskThreshold * 100)}%</p>
                  <p className="text-xs text-gray-500">Risk trigger</p>
                </div>
                <div>
                  <p className="font-medium text-black">{rule.minRunwayDays ?? "—"} days</p>
                  <p className="text-xs text-gray-500">Min. runway trigger</p>
                </div>
                <div>
                  <p className="font-medium text-black">{Math.round(rule.targetServiceLevel * 100)}%</p>
                  <p className="text-xs text-gray-500">Target service level</p>
                </div>
                <div>
                  <p className="font-medium text-black">{rule.approvalRequired ? "Yes" : "No"}</p>
                  <p className="text-xs text-gray-500">Approval required</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 text-xs">
                <button type="button" onClick={() => openEdit(rule)} className="font-medium text-black underline underline-offset-2">
                  Edit
                </button>
                <button type="button" onClick={() => handleToggleActive(rule)} disabled={isPending} className="text-gray-500 hover:text-black">
                  {rule.active ? "Disable" : "Enable"}
                </button>
                <button type="button" onClick={() => handleDelete(rule)} disabled={isPending} className="text-gray-500 hover:text-red-600">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? `Edit ${editing.name}` : "Create rule"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel>Rule name</FieldLabel>
            <TextInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Milk Reorder Policy" required />
          </div>
          <div>
            <FieldLabel>Business type</FieldLabel>
            <Select value={form.businessType} onChange={(e) => setForm((f) => ({ ...f, businessType: e.target.value }))}>
              <option value="">All business types</option>
              {businessTypeNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel>Category</FieldLabel>
            <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} required>
              {categoryNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Stockout-risk trigger (%)</FieldLabel>
              <TextInput
                type="number"
                min={0}
                max={100}
                value={form.stockoutRiskThreshold}
                onChange={(e) => setForm((f) => ({ ...f, stockoutRiskThreshold: e.target.value }))}
                required
              />
            </div>
            <div>
              <FieldLabel>Min. runway trigger (days)</FieldLabel>
              <TextInput type="number" min={0} value={form.minRunwayDays} onChange={(e) => setForm((f) => ({ ...f, minRunwayDays: e.target.value }))} />
            </div>
            <div>
              <FieldLabel>Target service level (%)</FieldLabel>
              <TextInput
                type="number"
                min={50}
                max={99}
                value={form.targetServiceLevel}
                onChange={(e) => setForm((f) => ({ ...f, targetServiceLevel: e.target.value }))}
                required
              />
            </div>
            <div>
              <FieldLabel>Reorder horizon (days)</FieldLabel>
              <TextInput
                type="number"
                min={0}
                value={form.reorderHorizonDays}
                onChange={(e) => setForm((f) => ({ ...f, reorderHorizonDays: e.target.value }))}
                required
              />
            </div>
          </div>
          <Toggle checked={form.approvalRequired} onChange={(v) => setForm((f) => ({ ...f, approvalRequired: v }))} label="Approval required before ordering" />
          <Toggle checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} label="Active" />
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
