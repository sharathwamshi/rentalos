import { useEffect, useState } from "react";
import { Building2, Users, Home, IndianRupee, TrendingUp } from "lucide-react";
import api from "../../api/client";
import { StatCard, PageHeader, Spinner } from "../../components/ui";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/admin/dashboard").then((r) => setData(r.data)); }, []);
  if (!data) return <Spinner />;

  return (
    <div>
      <PageHeader title="Platform Overview" subtitle="RentalOS-wide metrics across every owner" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Building2} label="Total Owners" value={data.total_owners} accent="bg-admin-gradient" />
        <StatCard icon={Users} label="Total Tenants" value={data.total_tenants} accent="bg-brand-gradient" />
        <StatCard icon={Home} label="Total Rooms" value={data.total_rooms} accent="bg-tenant-gradient" />
        <StatCard icon={IndianRupee} label="MRR" value={`₹${data.mrr.toLocaleString("en-IN")}`} accent="bg-emerald-500" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4"><TrendingUp size={18} className="text-brand-600" /><h3 className="font-display font-bold">Total rent collected (platform-wide)</h3></div>
          <p className="text-3xl font-display font-extrabold text-ink">₹{data.total_rent_collected_platform_wide.toLocaleString("en-IN")}</p>
        </div>
        <div className="card">
          <h3 className="font-display font-bold mb-4">Owners by plan</h3>
          <div className="space-y-3">
            {data.plan_breakdown.map((p) => (
              <div key={p.plan} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{p.plan || "No plan"}</span>
                <span className="pill-brand">{p.owners} owners</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
