import { cn } from "@/lib/utils";

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-heading text-4xl font-light">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-gray-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PrimaryButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black/85 disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export function SecondaryButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-black/5 disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export function StatusPill({ active, activeLabel = "Active", inactiveLabel = "Disabled" }: { active: boolean; activeLabel?: string; inactiveLabel?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-emerald-500" : "bg-gray-400")} />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-medium tracking-wide text-gray-500 uppercase">{children}</label>;
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-black/30",
        props.className
      )}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-black/30",
        props.className
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-black/30",
        props.className
      )}
    />
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", checked ? "bg-black" : "bg-gray-200")}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
            checked && "translate-x-4"
          )}
        />
      </button>
    </label>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <div className="rounded-3xl border border-dashed border-gray-200 p-10 text-center text-gray-500">{message}</div>;
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="mt-3 text-sm text-red-600">{message}</p>;
}

export function MetricTile({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-[#F5F4F1] p-4">
      <p className="font-heading text-2xl font-light">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{label}</p>
      {sublabel && <p className="mt-0.5 text-[11px] text-gray-400">{sublabel}</p>}
    </div>
  );
}
