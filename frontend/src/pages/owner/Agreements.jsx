import { useEffect, useState } from "react";
import { Plus, FileDown, FileText, RefreshCw } from "lucide-react";
import api from "../../api/client";
import { PageHeader, Modal, EmptyState, StatusPill, Spinner } from "../../components/ui";

export default function Agreements() {
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(null);
  const [vacantOrAssigned, setAssigned] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState({ room_id: "", tenant_id: "", monthly_rent: "", security_deposit: "", start_date: "", end_date: "" });
  const [renewForm, setRenewForm] = useState({ proposed_rent: "", proposed_start: "", proposed_end: "" });
  const [saving, setSaving] = useState(false);

  const load = () => api.get("/owner/agreements").then((r) => setRows(r.data));
  useEffect(() => { load(); }, []);

  const openModal = async () => {
    const [assign, t] = await Promise.all([api.get("/owner/assignments", { params: { active_only: true } }), api.get("/owner/tenants")]);
    setAssigned(assign.data);
    setTenants(t.data);
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const assignment = vacantOrAssigned.find((a) => a.tenant_id === +form.tenant_id);
      await api.post("/owner/agreements", { ...form, room_id: assignment?.room_id || form.room_id });
      setOpen(false);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Could not create agreement.");
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = (id) => window.open(`/api/owner/agreements/${id}/pdf`, "_blank");

  const submitRenewal = async (e) => {
    e.preventDefault();
    await api.post(`/owner/agreements/${renewOpen.id}/renewal`, renewForm);
    setRenewOpen(null);
    alert("Renewal proposal sent to the tenant.");
  };

  if (!rows) return <Spinner />;

  return (
    <div>
      <PageHeader title="Agreements" subtitle="Rental agreements, e-sign status and renewals"
        action={<button className="btn-primary" onClick={openModal}><Plus size={16} /> New agreement</button>} />

      {rows.length === 0 ? (
        <div className="card"><EmptyState icon={FileText} title="No agreements yet" subtitle="Create an agreement once a tenant is assigned to a unit." /></div>
      ) : (
        <div className="table-shell">
          <table className="data-table">
            <thead><tr><th>Agreement</th><th>Tenant</th><th>Unit</th><th>Period</th><th>Status</th><th>Signed</th><th></th></tr></thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="font-medium text-ink">{a.agreement_number}</td>
                  <td>{a.tenant_name}</td>
                  <td>{a.unit}</td>
                  <td>{a.start_date} – {a.end_date}</td>
                  <td><StatusPill status={a.status} /></td>
                  <td className="text-xs">
                    Owner {a.owner_signed ? "✅" : "—"} · Tenant {a.tenant_signed ? "✅" : "—"}
                  </td>
                  <td>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => downloadPdf(a.id)} className="text-slate-400 hover:text-brand-600" title="Download PDF"><FileDown size={16} /></button>
                      <button onClick={() => { setRenewOpen(a); setRenewForm({ proposed_rent: a.monthly_rent, proposed_start: a.end_date, proposed_end: "" }); }} className="text-slate-400 hover:text-brand-600" title="Propose renewal"><RefreshCw size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create agreement">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Tenant (with active room assignment)</label>
            <select className="input" required value={form.tenant_id} onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}>
              <option value="">Select tenant</option>
              {vacantOrAssigned.map((a) => <option key={a.id} value={a.tenant_id}>{a.tenant_name} — {a.unit}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Monthly rent</label><input type="number" className="input" required value={form.monthly_rent} onChange={(e) => setForm({ ...form, monthly_rent: e.target.value })} /></div>
            <div><label className="label">Security deposit</label><input type="number" className="input" value={form.security_deposit} onChange={(e) => setForm({ ...form, security_deposit: e.target.value })} /></div>
            <div><label className="label">Start date</label><input type="date" className="input" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><label className="label">End date</label><input type="date" className="input" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary flex-1" disabled={saving}>{saving ? "Creating..." : "Create agreement"}</button>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!renewOpen} onClose={() => setRenewOpen(null)} title={`Propose renewal — ${renewOpen?.agreement_number}`}>
        <form onSubmit={submitRenewal} className="space-y-4">
          <div><label className="label">Proposed monthly rent</label><input type="number" className="input" required value={renewForm.proposed_rent} onChange={(e) => setRenewForm({ ...renewForm, proposed_rent: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">New start date</label><input type="date" className="input" required value={renewForm.proposed_start} onChange={(e) => setRenewForm({ ...renewForm, proposed_start: e.target.value })} /></div>
            <div><label className="label">New end date</label><input type="date" className="input" required value={renewForm.proposed_end} onChange={(e) => setRenewForm({ ...renewForm, proposed_end: e.target.value })} /></div>
          </div>
          <button className="btn-primary w-full">Send proposal to tenant</button>
        </form>
      </Modal>
    </div>
  );
}
