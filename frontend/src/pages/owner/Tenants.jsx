import { useEffect, useState } from "react";
import { Plus, Trash2, Eye } from "lucide-react";
import api from "../../api/client";
import { PageHeader, Modal, EmptyState, Spinner } from "../../components/ui";
import { Users } from "lucide-react";

function empty() {
  return {
    full_name: "", email: "", password: "", phone: "", age: "", father_name: "", occupation: "",
    company_name: "", gst_number: "", current_address: "", permanent_address: "",
    id_proof_type: "", id_proof_number: "", police_verification: false,
    emergency_contact_name: "", emergency_contact_phone: "",
  };
}

export default function Tenants() {
  const [tenants, setTenants] = useState(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const load = () => api.get("/owner/tenants").then((r) => setTenants(r.data));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/owner/tenants", form);
      setOpen(false);
      setForm(empty());
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Could not create tenant.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Remove this tenant? This cannot be undone.")) return;
    await api.delete(`/owner/tenants/${id}`);
    load();
  };

  if (!tenants) return <Spinner />;
  const filtered = tenants.filter((t) => t.full_name.toLowerCase().includes(search.toLowerCase()) || t.email.includes(search));

  return (
    <div>
      <PageHeader
        title="Tenants" subtitle="Manage tenant records and documents"
        action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add tenant</button>}
      />

      {tenants.length === 0 ? (
        <div className="card"><EmptyState icon={Users} title="No tenants yet" subtitle="Add a tenant profile before assigning them to a room." /></div>
      ) : (
        <div className="table-shell">
          <div className="p-4 border-b border-slate-100">
            <input className="input max-w-xs" placeholder="Search tenants..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Occupation</th><th></th></tr></thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td className="font-medium text-ink">{t.full_name}</td>
                  <td>{t.email}</td>
                  <td>{t.phone || "—"}</td>
                  <td>{t.occupation || "—"}</td>
                  <td>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setView(t)} className="text-slate-400 hover:text-brand-600"><Eye size={16} /></button>
                      <button onClick={() => remove(t.id)} className="text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add tenant" wide>
        <form onSubmit={submit} className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-600 mb-3">General details</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="label">Full name</label><input className="input" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div><label className="label">Email</label><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className="label">Password</label><input className="input" type="password" placeholder="Auto-generated if left blank" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
              <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><label className="label">Age</label><input className="input" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></div>
              <div><label className="label">Father's name</label><input className="input" value={form.father_name} onChange={(e) => setForm({ ...form, father_name: e.target.value })} /></div>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-600 mb-3">Work & business</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div><label className="label">Occupation</label><input className="input" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} /></div>
              <div><label className="label">Company name</label><input className="input" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></div>
              <div><label className="label">GST number</label><input className="input" value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value })} /></div>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-600 mb-3">Address</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="label">Current address</label><textarea className="input" rows={2} value={form.current_address} onChange={(e) => setForm({ ...form, current_address: e.target.value })} /></div>
              <div><label className="label">Permanent address</label><textarea className="input" rows={2} value={form.permanent_address} onChange={(e) => setForm({ ...form, permanent_address: e.target.value })} /></div>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-600 mb-3">Identity documents</p>
            <div className="grid sm:grid-cols-3 gap-3 items-end">
              <div><label className="label">ID proof type</label>
                <select className="input" value={form.id_proof_type} onChange={(e) => setForm({ ...form, id_proof_type: e.target.value })}>
                  <option value="">Select ID proof type</option><option>Aadhaar</option><option>PAN</option><option>Passport</option><option>Voter ID</option>
                </select>
              </div>
              <div><label className="label">ID proof number</label><input className="input" value={form.id_proof_number} onChange={(e) => setForm({ ...form, id_proof_number: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm pb-2.5">
                <input type="checkbox" checked={form.police_verification} onChange={(e) => setForm({ ...form, police_verification: e.target.checked })} />
                Police verification done
              </label>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-600 mb-3">Emergency contact</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="label">Contact name</label><input className="input" value={form.emergency_contact_name} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} /></div>
              <div><label className="label">Contact phone</label><input className="input" value={form.emergency_contact_phone} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} /></div>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary flex-1" disabled={saving}>{saving ? "Saving..." : "Save tenant"}</button>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!view} onClose={() => setView(null)} title={view?.full_name}>
        {view && (
          <div className="space-y-2 text-sm">
            <p><span className="text-slate-400">Email:</span> {view.email}</p>
            <p><span className="text-slate-400">Phone:</span> {view.phone || "—"}</p>
            <p><span className="text-slate-400">Occupation:</span> {view.occupation || "—"}</p>
            <p><span className="text-slate-400">Company:</span> {view.company_name || "—"}</p>
            <p><span className="text-slate-400">Current address:</span> {view.current_address || "—"}</p>
            <p><span className="text-slate-400">Permanent address:</span> {view.permanent_address || "—"}</p>
            <p><span className="text-slate-400">ID proof:</span> {view.id_proof_type || "—"}</p>
            <p><span className="text-slate-400">Police verification:</span> {view.police_verification ? "Yes" : "No"}</p>
            <p><span className="text-slate-400">Emergency contact:</span> {view.emergency_contact_name} {view.emergency_contact_phone}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
