import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import api from "../../api/client";
import { PageHeader, StatCard, Spinner } from "../../components/ui";
import { IndianRupee, FileWarning, Users, Home } from "lucide-react";

export default function Reports() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState({ from: "2026-08-01", to: new Date().toISOString().slice(0, 10) });

  const load = () => api.get("/owner/reports", { params: range }).then((r) => setData(r.data));
  useEffect(() => { load(); }, []);

  return (
    <div>
      <PageHeader title="Reports" subtitle="Revenue, occupancy, and receivables"
        action={<a href="/api/owner/reports/export" className="btn-secondary"><Download size={16} /> Export CSV</a>} />

      <div className="card mb-6 flex flex-wrap items-end gap-3">
        <div><label className="label">From</label><input type="date" className="input" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} /></div>
        <div><label className="label">To</label><input type="date" className="input" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></div>
        <button className="btn-primary" onClick={load}>Apply</button>
      </div>

      {!data ? <Spinner /> : (
        <>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <StatCard icon={IndianRupee} label="Revenue (payments in period)" value={`₹${data.revenue.toLocaleString("en-IN")}`} sub={`Payments counted: ${data.payments_counted}`} />
            <StatCard icon={FileWarning} label="Pending invoices" value={data.pending_invoices} accent="bg-amber-500" />
            <StatCard icon={Users} label="Registered tenants" value={data.registered_tenants} accent="bg-tenant-gradient" />
          </div>
          <div className="card">
            <h3 className="font-display font-bold mb-4">Room occupancy snapshot</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[["Total rooms", data.total_rooms, "text-ink"], ["Vacant", data.vacant, "text-slate-500"], ["Occupied", data.occupied, "text-emerald-600"], ["Maintenance", data.maintenance, "text-amber-600"]].map(([l, v, c]) => (
                <div key={l} className="text-center rounded-xl bg-slate-50 py-5">
                  <p className={`text-3xl font-display font-extrabold ${c}`}>{v}</p>
                  <p className="text-xs text-slate-500 mt-1">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
