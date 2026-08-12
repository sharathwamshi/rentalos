import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Home, Clock, Wrench, Plus, UserPlus, ArrowLeftRight, Receipt,
  AlertTriangle, FileWarning, DoorOpen, FileSignature, IndianRupee, TrendingUp, ArrowRight,
} from "lucide-react";
import api from "../../api/client";
import { StatCard, PageHeader, Spinner, EmptyState } from "../../components/ui";

const QUICK_ACTIONS = [
  { to: "/owner/properties", label: "Add property", icon: Building2 },
  { to: "/owner/tenants", label: "Add tenant", icon: UserPlus },
  { to: "/owner/assignments", label: "Assign a room", icon: ArrowLeftRight },
  { to: "/owner/invoices", label: "Create invoice", icon: Receipt },
];

export default function OwnerDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/owner/dashboard").then((r) => setData(r.data));
  }, []);

  if (!data) return <Spinner />;

  const attentionCards = [
    { key: "overdue_invoices", label: "Overdue invoices", icon: FileWarning, to: "/owner/invoices", color: "text-rose-600 bg-rose-50" },
    { key: "open_tickets", label: "Open maintenance tickets", icon: Wrench, to: "/owner/maintenance", color: "text-amber-600 bg-amber-50" },
    { key: "pending_vacate_requests", label: "Pending vacate requests", icon: DoorOpen, to: "/owner/assignments", color: "text-amber-600 bg-amber-50" },
    { key: "unsigned_agreements", label: "Unsigned agreements", icon: FileSignature, to: "/owner/agreements", color: "text-brand-600 bg-brand-50" },
  ].filter((c) => data.attention[c.key] > 0);

  const isEmpty = data.total_properties === 0;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${data.owner_name?.split(" ")[0]}`}
        subtitle={data.plan_name ? `${data.plan_name} plan \u00b7 Overview of your properties, rooms, and status` : "Overview of your properties, rooms, and status"}
      />

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {QUICK_ACTIONS.map((a) => (
          <button key={a.to} onClick={() => navigate(a.to)}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-ink hover:border-brand-300 hover:bg-brand-50 transition text-left">
            <span className="h-8 w-8 rounded-lg bg-brand-gradient text-white flex items-center justify-center shrink-0">
              <a.icon size={15} />
            </span>
            {a.label}
          </button>
        ))}
      </div>

      {isEmpty ? (
        <div className="card">
          <EmptyState
            icon={Building2}
            title="Let's set up your first property"
            subtitle="Add a property and its rooms, then add tenants and assign them to units. Your dashboard fills in as you go."
            action={<button className="btn-primary" onClick={() => navigate("/owner/properties")}><Plus size={16} /> Add your first property</button>}
          />
        </div>
      ) : (
        <>
          {/* Needs your attention */}
          {attentionCards.length > 0 && (
            <div className="card mb-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={17} className="text-amber-500" />
                <h3 className="font-display font-bold">Needs your attention</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {attentionCards.map((c) => (
                  <button key={c.key} onClick={() => navigate(c.to)}
                    className="text-left rounded-xl border border-slate-100 p-4 hover:border-brand-200 hover:shadow-card transition group">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${c.color}`}>
                      <c.icon size={16} />
                    </div>
                    <p className="text-2xl font-display font-extrabold text-ink">{data.attention[c.key]}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">{c.label} <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition" /></p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={IndianRupee} label="Revenue this month" value={`\u20b9${data.revenue_this_month.toLocaleString("en-IN")}`} accent="bg-emerald-500" />
            <StatCard icon={Home} label="Occupancy" value={`${data.occupancy_pct}%`} sub={`${data.occupied} of ${data.total_rooms} rooms`} accent="bg-brand-gradient" />
            <StatCard icon={Clock} label="Close to expire" value={data.close_to_expire} sub="Rooms" accent="bg-amber-500" />
            <StatCard icon={Wrench} label="Maintenance" value={data.maintenance} sub="Rooms" accent="bg-rose-500" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Properties with occupancy bars */}
            <div className="card">
              <h3 className="font-display font-bold mb-4">Your properties</h3>
              <div className="space-y-4">
                {data.properties.map((p) => {
                  const pct = p.total_rooms ? Math.round((p.occupied_rooms / p.total_rooms) * 100) : 0;
                  return (
                    <div key={p.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <p className="font-semibold text-sm text-ink">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.location}</p>
                        </div>
                        <span className="text-xs font-semibold text-slate-500">{p.occupied_rooms}/{p.total_rooms} occupied</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-brand-gradient rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent payments */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold flex items-center gap-2"><TrendingUp size={16} className="text-emerald-600" /> Recent payments</h3>
                <button onClick={() => navigate("/owner/invoices")} className="text-xs font-semibold text-brand-600">View all</button>
              </div>
              {data.recent_payments.length === 0 ? (
                <p className="text-sm text-slate-400">No payments recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.recent_payments.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-ink">{p.tenant_name}</p>
                        <p className="text-xs text-slate-400">{p.unit} \u00b7 {p.method}</p>
                      </div>
                      <span className="font-mono font-semibold">\u20b9{p.amount.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
