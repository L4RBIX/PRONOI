"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { ORDER_STATUS_LABELS, ORDER_STATUS_SEQUENCE, type OrderStatus } from "@/lib/pronoi/orderStatus";
import { KZT } from "@/lib/pronoi/decisions";
import { advanceOrderStatusAction } from "@/server/pronoi/actions";
import { cn } from "@/lib/utils";

export interface OrderView {
  id: string;
  poNumber: string;
  status: OrderStatus;
  totalAmount: number;
  etaDays: number;
  supplierName: string;
  items: { productName: string; quantity: number; unit: string }[];
}

const TABS = ["Active", "Completed", "All"] as const;
type Tab = (typeof TABS)[number];

function supplierMessageFor(order: OrderView): string | null {
  const stepIndex = ORDER_STATUS_SEQUENCE.indexOf(order.status);
  if (stepIndex < 2) return null;
  const item = order.items[0];
  return `Здравствуйте! Ваш заказ ${order.poNumber} на ${item?.quantity} ${item?.unit} (${item?.productName}) принят в обработку. Ожидаемая дата поставки — через ${order.etaDays} дн. Свяжемся, если что-то изменится.`;
}

function OrderTimeline({ status }: { status: OrderStatus }) {
  const step = ORDER_STATUS_SEQUENCE.indexOf(status);
  return (
    <div className="flex min-w-[420px] items-center">
      {ORDER_STATUS_SEQUENCE.map((s, i) => (
        <div key={s} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", i <= step ? "bg-black" : "border border-gray-300 bg-white")} />
            <span className={cn("text-[11px] whitespace-nowrap", i <= step ? "font-medium text-black" : "text-gray-400")}>
              {ORDER_STATUS_LABELS[s]}
            </span>
          </div>
          {i < ORDER_STATUS_SEQUENCE.length - 1 && (
            <div className={cn("mx-1.5 h-px flex-1 sm:mx-2", i < step ? "bg-black" : "bg-gray-200")} />
          )}
        </div>
      ))}
    </div>
  );
}

function OrderCard({ order: initialOrder, highlighted }: { order: OrderView; highlighted?: boolean }) {
  const [order, setOrder] = useState(initialOrder);
  const [showMessage, setShowMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pulse, setPulse] = useState(Boolean(highlighted));
  const cardRef = useRef<HTMLDivElement>(null);
  const message = supplierMessageFor(order);
  const delivered = order.status === "DELIVERED";
  const item = order.items[0];

  useEffect(() => {
    if (!highlighted) return;
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    const timeout = setTimeout(() => setPulse(false), 2600);
    return () => clearTimeout(timeout);
  }, [highlighted]);

  function handleAdvance() {
    setError(null);
    startTransition(async () => {
      const result = await advanceOrderStatusAction(order.id);
      if (!result.ok || !result.data) {
        setError(result.error?.message ?? "Couldn't advance this order.");
        return;
      }
      setOrder((prev) => ({ ...prev, status: result.data!.status as OrderStatus }));
    });
  }

  return (
    <div
      ref={cardRef}
      className={cn(
        "rounded-3xl border p-6 transition-shadow duration-700",
        pulse ? "border-black ring-4 ring-black/10" : "border-black/5"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-gray-500">{order.poNumber}</p>
          <h3 className="font-heading text-2xl font-medium">
            {item?.quantity} {item?.unit} {item?.productName}
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            from {order.supplierName} · {KZT(order.totalAmount)} · ETA {order.etaDays} days
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <OrderTimeline status={order.status} />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {message ? (
          <button
            type="button"
            onClick={() => setShowMessage((v) => !v)}
            className="text-xs font-medium text-gray-500 underline underline-offset-2"
          >
            {showMessage ? "Hide" : "View"} supplier message (simulated)
          </button>
        ) : (
          <span />
        )}

        {!delivered && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] tracking-wide text-gray-400 uppercase">Demo control</span>
            <button
              type="button"
              onClick={handleAdvance}
              disabled={isPending}
              className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-black/5 disabled:opacity-60"
            >
              {isPending ? "Advancing…" : "Advance status"}
            </button>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {showMessage && message && (
        <div className="mt-3 max-w-sm rounded-2xl rounded-tl-sm bg-emerald-50 p-3 text-sm text-emerald-950">
          {message}
          <p className="mt-1 text-right text-[10px] text-emerald-700/70">via WhatsApp · simulated, not a live integration</p>
        </div>
      )}
    </div>
  );
}

export function OrdersView({ orders, highlightOrderId }: { orders: OrderView[]; highlightOrderId?: string }) {
  const highlighted = highlightOrderId ? orders.find((o) => o.id === highlightOrderId) : undefined;
  const [tab, setTab] = useState<Tab>(highlighted?.status === "DELIVERED" ? "Completed" : "Active");

  const delivered = orders.filter((o) => o.status === "DELIVERED");
  const active = orders.filter((o) => o.status !== "DELIVERED");
  const visible = tab === "Active" ? active : tab === "Completed" ? delivered : orders;

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-black/5">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "relative px-3 py-2.5 text-sm font-medium transition-colors",
              tab === t ? "text-black" : "text-gray-400 hover:text-gray-600"
            )}
          >
            {t}
            {t === "Active" && active.length > 0 && <span className="ml-1.5 text-xs text-gray-400">{active.length}</span>}
            {tab === t && <span className="absolute inset-x-0 -bottom-px h-px bg-black" />}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 p-10 text-center text-gray-500">
          {orders.length === 0 ? (
            <>
              No purchase orders yet.{" "}
              <Link href="/dashboard/decisions" className="underline">
                Approve a decision
              </Link>{" "}
              to create one.
            </>
          ) : (
            `No ${tab.toLowerCase()} orders.`
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((order) => (
            <OrderCard key={order.id} order={order} highlighted={order.id === highlightOrderId} />
          ))}
        </div>
      )}
    </div>
  );
}
