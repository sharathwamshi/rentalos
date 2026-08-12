import { useEffect, useState } from "react";
import { DoorOpen } from "lucide-react";
import api from "../../api/client";
import { PageHeader, EmptyState, StatusPill, Spinner } from "../../components/ui";

export default function VacateRequest() {
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState({ requested_vacate_date: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () => api.get("/tenant/vacate-request").then((r) => setRows(r.data));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      await api.post("/tenant/vacate-request", form);
      setMsg("Your vacate notice has been sent to your owner.");
      setForm({ requested_vacate_date: "", reason: "" });
      load();
    } catch (err) {
      setMsg(err.response?.data?.error || "Could not submit request.");
    } finally {
      setSaving(false);
    }
  };

  if (!rows) return <Spinner />;
  const hasPending = rows.some((r) => r.status === "pending");

  return (
    <div>
      <PageHeader title="Vacate Request" subtitle="Give your owner notice that you intend to move out" />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-display font-bold mb-4">Submit a new request</h3>
          {hasPending ? (
            <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">You already have a pending vacate request. Your owner will respond soon.</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div><label className="label">Intended vacate date</label><input type="date" className="input" required value={form.requested_vacate_date} onChange={(e) => setForm({ ...form, requested_vacate_date: e.target.value })} /></div>
              <div><label className="label">Reason (optional)</label><textarea className="input" rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
              {msg && <p className="text-sm text-tenant-700 bg-cyan-50 rounded-lg p-3">{msg}</p>}
              <button className="btn-primary w-full !bg-tenant-gradient" disabled={saving}>{saving ? "Sending..." : "Send vacate notice"}</button>
            </form>
          )}
        </div>
        <div className="card">
          <h3 className="font-display font-bold mb-4">Your requests</h3>
          {rows.length === 0 ? <EmptyState icon={DoorOpen} title="No requests submitted" /> : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-100 p-3.5 flex items-center justify-between">
                  <div><p className="text-sm font-medium">Vacate by {r.requested_vacate_date}</p><p className="text-xs text-slate-400">{r.reason || "No reason given"}</p></div>
                  <StatusPill status={r.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
