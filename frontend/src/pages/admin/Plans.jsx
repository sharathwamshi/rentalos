import { useEffect, useState } from "react";
import { Plus, Check } from "lucide-react";
import api from "../../api/client";
import { PageHeader, Modal, Spinner } from "../../components/ui";

export default function Plans() {
  const [plans, setPlans] = useState(null);
  const [edit, setEdit] = useState(null);
  const [open, setOpen] = useState(false);

  const load = () => api.get("/admin/plans").then((r) => setPlans(r.data));
  useEffect(() => { load(); }, []);

  const openEdit = (p) => {
    setEdit({ ...p, featuresText: (p.features || []).join("\n") });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...edit, features: edit.featuresText.split("\n").filter(Boolean) };
    if (edit.id) await api.put(`/admin/plans/${edit.id}`, payload);
    else await api.post("/admin/plans", payload);
    setOpen(false);
    load();
  };

  if (!plans) return <Spinner />;

  return (
    <div>
      <PageHeader title="Subscription Plans" subtitle="Plans owners can subscribe to"
        action={<button className="btn-primary" onClick={() => openEdit({ name: "", price_per_month: "", room_limit: "", multi_property: false, features: [] })}><Plus size={16} /> New plan</button>} />

      <div className="grid md:grid-cols-3 gap-5">
        {plans.map((p) => (
          <div key={p.id} className="card">
            <p className="font-display font-bold text-lg">{p.name}</p>
            <p className="text-3xl font-display font-extrabold mt-1 mb-3">₹{p.price_per_month}<span className="text-sm font-normal text-slate-400">/mo</span></p>
            <p className="text-xs text-slate-500 mb-3">Room limit: {p.room_limit ?? "Unlimited"}</p>
            <ul className="space-y-1.5 mb-4">
              {p.features.map((f) => <li key={f} className="flex items-start gap-2 text-xs text-slate-600"><Check size={13} className="text-emerald-500 mt-0.5 shrink-0" />{f}</li>)}
            </ul>
            <button className="btn-secondary w-full" onClick={() => openEdit(p)}>Edit plan</button>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={edit?.id ? "Edit plan" : "New plan"}>
        {edit && (
          <form onSubmit={save} className="space-y-4">
            <div><label className="label">Name</label><input className="input" required value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Price / month (₹)</label><input type="number" className="input" required value={edit.price_per_month} onChange={(e) => setEdit({ ...edit, price_per_month: e.target.value })} /></div>
              <div><label className="label">Room limit (blank = unlimited)</label><input type="number" className="input" value={edit.room_limit || ""} onChange={(e) => setEdit({ ...edit, room_limit: e.target.value || null })} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={edit.multi_property} onChange={(e) => setEdit({ ...edit, multi_property: e.target.checked })} /> Multi-property dashboard included</label>
            <div><label className="label">Features (one per line)</label><textarea className="input" rows={5} value={edit.featuresText} onChange={(e) => setEdit({ ...edit, featuresText: e.target.value })} /></div>
            <button className="btn-primary w-full">Save plan</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
