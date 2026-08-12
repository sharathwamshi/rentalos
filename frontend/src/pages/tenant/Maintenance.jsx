import { useEffect, useState } from "react";
import { Plus, Wrench } from "lucide-react";
import api from "../../api/client";
import { PageHeader, Modal, EmptyState, StatusPill, Spinner } from "../../components/ui";

export default function TenantMaintenance() {
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "electrical", priority: "medium" });
  const [saving, setSaving] = useState(false);

  const load = () => api.get("/tenant/maintenance").then((r) => setRows(r.data));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/tenant/maintenance", form);
      setOpen(false);
      setForm({ title: "", description: "", category: "electrical", priority: "medium" });
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Could not submit request.");
    } finally {
      setSaving(false);
    }
  };

  if (!rows) return <Spinner />;

  return (
    <div>
      <PageHeader title="Maintenance" subtitle="Report an issue with your unit"
        action={<button className="btn-primary !bg-tenant-gradient" onClick={() => setOpen(true)}><Plus size={16} /> Raise a request</button>} />

      {rows.length === 0 ? (
        <div className="card"><EmptyState icon={Wrench} title="No requests yet" subtitle="Report a broken geyser, leak, or anything else that needs attention." /></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {rows.map((t) => (
            <div key={t.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <p className="font-semibold text-sm text-ink">{t.title}</p><StatusPill status={t.status} />
              </div>
              <p className="text-sm text-slate-600 mb-2">{t.description}</p>
              <span className="pill-neutral capitalize">{t.category} · {t.priority}</span>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Raise a maintenance request">
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label">Title</label><input className="input" required placeholder="e.g. Geyser not working" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Description</label><textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="electrical">Electrical</option><option value="plumbing">Plumbing</option><option value="appliance">Appliance</option><option value="other">Other</option>
              </select>
            </div>
            <div><label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <button className="btn-primary w-full !bg-tenant-gradient" disabled={saving}>{saving ? "Submitting..." : "Submit request"}</button>
        </form>
      </Modal>
    </div>
  );
}
