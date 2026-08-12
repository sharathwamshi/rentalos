import { useEffect, useState } from "react";
import { ShieldCheck, Wallet, CalendarClock, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import { StatCard, PageHeader, Spinner } from "../../components/ui";

export default function TenantDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/tenant/dashboard").then((r) => setData(r.data)); }, []);
  if (!data) return <Spinner />;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of your rent, room and payments" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={ShieldCheck} label="Current Rent Status" value={data.current_rent_status}
          accent={data.current_rent_status === "Overdue" ? "bg-rose-500" : "bg-tenant-gradient"} />
        <StatCard icon={Wallet} label="Upcoming Due Amount" value={`₹${data.upcoming_due_amount.toLocaleString("en-IN")}`} />
        <StatCard icon={CalendarClock} label="Agreement Validity" value={data.agreement_validity || "—"} />
        <StatCard icon={AlertTriangle} label="Pending Payments" value={data.pending_payments} accent="bg-amber-500" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold">Current Assigned Room</h3>
            <Link to="/tenant/my-room" className="text-xs font-semibold text-tenant-600">View</Link>
          </div>
          {data.current_room ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Unit</span><span className="font-medium">{data.current_room.unit}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Unit type</span><span className="font-medium">{data.current_room.unit_type || "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Rent due date</span><span className="font-medium">{data.current_room.rent_due_date || "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Agreement expiry</span><span className="font-medium">{data.current_room.agreement_expiry || "—"}</span></div>
            </div>
          ) : <p className="text-sm text-slate-400">No room currently assigned.</p>}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold">Recent Payments</h3>
            <Link to="/tenant/invoices" className="text-xs font-semibold text-tenant-600">View all</Link>
          </div>
          {data.recent_payments.length === 0 ? (
            <p className="text-sm text-slate-400">No payments yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-slate-400 uppercase"><th className="text-left pb-2">Invoice</th><th className="text-left pb-2">Paid date</th><th className="text-right pb-2">Amount</th></tr></thead>
              <tbody>
                {data.recent_payments.map((p, i) => (
                  <tr key={i} className="border-t border-slate-50"><td className="py-2">{p.invoice}</td><td>{p.paid_date}</td><td className="text-right font-mono">₹{p.amount}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
