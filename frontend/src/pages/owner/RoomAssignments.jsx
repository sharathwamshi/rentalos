import { useEffect, useState } from "react";
import { Plus, ArrowLeftRight, UserPlus, Home, ArrowRight, CheckCircle2 } from "lucide-react";
import api from "../../api/client";
import { PageHeader, Modal, EmptyState, Spinner } from "../../components/ui";

const STEPS = ["Pick a unit", "Pick a tenant", "Confirm"];

export default function RoomAssignments() {
  const [rows, setRows] = useState(null);
  const [activeOnly, setActiveOnly] = useState(true);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [vacantRooms, setVacantRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState({ room_id: "", tenant_id: "", assigned_at: new Date().toISOString().slice(0, 10), notes: "" });
  const [saving, setSaving] = useState(false);
  const [addTenantOpen, setAddTenantOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [addingTenant, setAddingTenant] = useState(false);

  const load = () => api.get("/owner/assignments", { params: { active_only: activeOnly } }).then((r) => setRows(r.data));
  useEffect(() => { load(); }, [activeOnly]);

  const openModal = async () => {
    const [vr, t] = await Promise.all([api.get("/owner/rooms/vacant"), api.get("/owner/tenants")]);
    setVacantRooms(vr.data);
    setTenants(t.data.filter((x) => !x.is_assigned));
    setForm({ room_id: "", tenant_id: "", assigned_at: new Date().toISOString().slice(0, 10), notes: "" });
    setStep(0);
    setOpen(true);
  };

  const refreshTenants = async () => {
    const t = await api.get("/owner/tenants");
    setTenants(t.data.filter((x) => !x.is_assigned));
  };

  const createTenantInline = async (e) => {
    e.preventDefault();
    setAddingTenant(true);
    try {
      const { data } = await api.post("/owner/tenants", newTenant);
      await refreshTenants();
      setForm((f) => ({ ...f, tenant_id: String(data.id) }));
      setAddTenantOpen(false);
      setNewTenant({ full_name: "", email: "", phone: "", password: "" });
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.error || "Could not create tenant.");
    } finally {
      setAddingTenant(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/owner/assignments", form);
      setOpen(false);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Could not assign tenant.");
    } finally {
      setSaving(false);
    }
  };

  const vacate = async (id) => {
    if (!confirm("Mark this unit as vacant?")) return;
    await api.post(`/owner/assignments/${id}/vacate`);
    load();
  };

  if (!rows) return <Spinner />;

  const selectedRoom = vacantRooms.find((r) => r.id === +form.room_id);
  const selectedTenant = tenants.find((t) => t.id === +form.tenant_id);

  return (
    <div>
      <PageHeader title="Room Assignments" subtitle="Move a tenant into a vacant unit in three quick steps"
        action={<button className="btn-primary" onClick={openModal}><Plus size={16} /> Assign tenant</button>} />

      <div className="table-shell">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <select className="input max-w-[180px]" value={activeOnly ? "active" : "all"} onChange={(e) => setActiveOnly(e.target.value === "active")}>
            <option value="active">Active only</option><option value="all">All (incl. history)</option>
          </select>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={ArrowLeftRight} title="No assignments yet" subtitle="Assign a tenant to a vacant unit to get started." />
        ) : (
          <table className="data-table">
            <thead><tr><th>Unit</th><th>Tenant</th><th>Assigned</th><th>Vacated</th><th></th></tr></thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="font-medium text-ink">{a.unit}</td>
                  <td>{a.tenant_name}</td>
                  <td>{a.assigned_at}</td>
                  <td>{a.vacated_at || "—"}</td>
                  <td className="text-right">
                    {a.is_active && <button onClick={() => vacate(a.id)} className="btn-secondary !py-1.5 !px-3 text-xs">Vacate</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Assign tenant to room" wide>
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                i < step ? "bg-emerald-500 text-white" : i === step ? "bg-brand-gradient text-white" : "bg-slate-100 text-slate-400"
              }`}>
                {i < step ? <CheckCircle2 size={15} /> : i + 1}
              </div>
              <span className={`text-xs font-medium ${i === step ? "text-ink" : "text-slate-400"}`}>{label}</span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-slate-100" />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div>
            <p className="text-sm text-slate-500 mb-4">Which unit are you filling?</p>
            {vacantRooms.length === 0 ? (
              <EmptyState icon={Home} title="No vacant units" subtitle="Every unit is currently occupied. Add a new property or room first." />
            ) : (
              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                {vacantRooms.map((r) => (
                  <button key={r.id} type="button" onClick={() => setForm({ ...form, room_id: String(r.id) })}
                    className={`text-left rounded-xl border-2 p-4 transition ${form.room_id === String(r.id) ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-brand-200"}`}>
                    <Home size={16} className="text-brand-600 mb-2" />
                    <p className="font-semibold text-sm">{r.label}</p>
                  </button>
                ))}
              </div>
            )}
            <button className="btn-primary w-full" disabled={!form.room_id} onClick={() => setStep(1)}>
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">Who's moving into <b className="text-ink">{selectedRoom?.label}</b>?</p>
              <button type="button" className="btn-secondary !py-1.5 !px-3 text-xs" onClick={() => setAddTenantOpen(true)}>
                <UserPlus size={14} /> Add new tenant
              </button>
            </div>
            {tenants.length === 0 ? (
              <EmptyState icon={UserPlus} title="No unassigned tenants yet"
                subtitle="Every tenant you've added is already housed somewhere. Add a new tenant to continue."
                action={<button className="btn-primary" onClick={() => setAddTenantOpen(true)}><UserPlus size={16} /> Add new tenant</button>} />
            ) : (
              <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                {tenants.map((t) => (
                  <button key={t.id} type="button" onClick={() => setForm({ ...form, tenant_id: String(t.id) })}
                    className={`w-full text-left rounded-xl border-2 p-3.5 flex items-center gap-3 transition ${form.tenant_id === String(t.id) ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-brand-200"}`}>
                    <div className="h-9 w-9 rounded-full bg-brand-gradient text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {t.full_name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{t.full_name}</p>
                      <p className="text-xs text-slate-400 truncate">{t.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" className="btn-secondary" onClick={() => setStep(0)}>Back</button>
              <button className="btn-primary flex-1" disabled={!form.tenant_id} onClick={() => setStep(2)}>
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={submit} className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 flex items-center justify-between text-sm">
              <div><p className="text-slate-400 text-xs">Unit</p><p className="font-semibold">{selectedRoom?.label}</p></div>
              <ArrowRight size={16} className="text-slate-300" />
              <div><p className="text-slate-400 text-xs">Tenant</p><p className="font-semibold">{selectedTenant?.full_name}</p></div>
            </div>
            <div>
              <label className="label">Agreement at</label>
              <input type="date" className="input" required value={form.assigned_at} onChange={(e) => setForm({ ...form, assigned_at: e.target.value })} />
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <textarea className="input" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <button type="button" className="btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button className="btn-primary flex-1" disabled={saving}>{saving ? "Saving..." : "Confirm assignment"}</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={addTenantOpen} onClose={() => setAddTenantOpen(false)} title="Add new tenant">
        <form onSubmit={createTenantInline} className="space-y-4">
          <p className="text-xs text-slate-400 -mt-2">Just the basics for now — you can fill in ID proof, address, and emergency contact anytime from the Tenants page.</p>
          <div><label className="label">Full name</label><input className="input" required value={newTenant.full_name} onChange={(e) => setNewTenant({ ...newTenant, full_name: e.target.value })} /></div>
          <div><label className="label">Email</label><input className="input" type="email" required value={newTenant.email} onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })} /></div>
          <div><label className="label">Phone</label><input className="input" value={newTenant.phone} onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })} /></div>
          <div><label className="label">Password</label><input className="input" type="password" placeholder="Auto-generated if left blank" value={newTenant.password} onChange={(e) => setNewTenant({ ...newTenant, password: e.target.value })} /></div>
          <div className="flex gap-3">
            <button type="button" className="btn-secondary" onClick={() => setAddTenantOpen(false)}>Cancel</button>
            <button className="btn-primary flex-1" disabled={addingTenant}>{addingTenant ? "Adding..." : "Add & select tenant"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
