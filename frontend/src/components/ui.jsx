import { X } from "lucide-react";

export function StatCard({ icon: Icon, label, value, sub, accent = "bg-brand-gradient" }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${accent}`}>
        <Icon size={20} strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p className="text-2xl font-display font-extrabold text-ink mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-display font-extrabold text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
      <div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-xl2 bg-white shadow-card-hover max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="font-display font-bold text-lg text-ink">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-ink">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="h-14 w-14 rounded-2xl bg-brand-gradient-soft flex items-center justify-center mb-4">
          <Icon size={26} className="text-brand-600" />
        </div>
      )}
      <p className="font-display font-bold text-ink">{title}</p>
      {subtitle && <p className="text-sm text-slate-500 mt-1 max-w-sm">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatusPill({ status }) {
  const map = {
    active: "pill-success", paid: "pill-success", resolved: "pill-success", approved: "pill-success",
    occupied: "pill-brand", accepted: "pill-success",
    pending: "pill-warning", partially_paid: "pill-warning", close_to_expire: "pill-warning", open: "pill-warning",
    overdue: "pill-danger", expired: "pill-danger", maintenance: "pill-danger", rejected: "pill-danger", declined: "pill-danger",
    vacant: "pill-neutral", terminated: "pill-neutral", closed: "pill-neutral", in_progress: "pill-brand",
  };
  const cls = map[status] || "pill-neutral";
  return <span className={cls}>{String(status).replace(/_/g, " ")}</span>;
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
    </div>
  );
}
