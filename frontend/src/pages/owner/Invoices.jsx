import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileDown, Eye, Receipt, CheckCircle2 } from "lucide-react";
import api from "../../api/client";
import { PageHeader, Modal, EmptyState, StatusPill, Spinner } from "../../components/ui";

function pdfUrl(path) {
  const token = localStorage.getItem("access_token");
  return `${path}?token=${encodeURIComponent(token || "")}`;
}

export default function Invoices() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState({ tenant_id: "", room_id: "", billing_month: "", due_date: "", rent: "", electricity: 0, water: 0, maintenance: 0, other_charges: 0 });
  const [saving, setSaving] = useState(false);

  const load = () => api.get("/owner/invoices", { params: { status } }).then((r) => setRows(r.data));
  useEffect(() => { load(); }, [status]);

  const openModal = async () => {
    const a = await api.get("/owner/assignments", { params: { active_only: true } });
    setAssignments(a.data);
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const assignment = assignments.find((a) => a.tenant_id === +form.tenant_id);
      await api.post("/owner/invoices", { ...form, room_id: assignment?.room_id });
      setOpen(false);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Could not create invoice.");
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (id) => {
    await api.post(`/owner/invoices/${id}/mark-paid`);
    load();
  };

  if (!rows) return <Spinner />;

  return (
    <div>
      <PageHeader title="Invoices & Payments" subtitle="Track rent invoices and record payments"
        action={<button className="btn-primary" onClick={openModal}><Plus size={16} /> New invoice</button>} />

      <div className="table-shell">
        <div className="p-4 border-b border-slate-100 flex gap-3">
          <select className="input max-w-[180px]" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Status: all</option><option value="pending">Pending</option><option value="paid">Paid</option>
            <option value="partially_paid">Partially paid</option><option value="overdue">Overdue</option>
          </select>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={Receipt} title="No invoices" subtitle="Create your first invoice for a tenant." />
        ) : (
          <table className="data-table">
            <thead><tr><th>Invoice</th><th>Month</th><th>Tenant</th><th>Unit</th><th>Total</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id}>
                  <td className="font-medium text-ink">{i.invoice_number}</td>
                  <td>{i.billing_month}</td>
                  <td>{i.tenant_name}</td>
                  <td>{i.unit}</td>
                  <td className="font-mono">₹{i.total.toLocaleString("en-IN")}</td>
                  <td><StatusPill status={i.status} /></td>
                  <td>
                    <div className="flex items-center gap-3 justify-end">
                      {i.status !== "paid" && (
                        <button onClick={() => markPaid(i.id)} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 size={14} /> Mark as paid
                        </button>
                      )}
                      <button onClick={() => navigate(`/owner/invoices/${i.id}`)} className="text-slate-400 hover:text-brand-600" title="View"><Eye size={16} /></button>
                      <a href={pdfUrl(`/api/owner/invoices/${i.id}/pdf`)} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-brand-600" title="Download PDF"><FileDown size={16} /></a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Create invoice">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Tenant</label>
            <select className="input" required value={form.tenant_id} onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}>
              <option value="">Select tenant</option>
              {assignments.map((a) => <option key={a.id} value={a.tenant_id}>{a.tenant_name} — {a.unit}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Billing month</label><input className="input" placeholder="June 2026" required value={form.billing_month} onChange={(e) => setForm({ ...form, billing_month: e.target.value })} /></div>
            <div><label className="label">Due date</label><input type="date" className="input" required value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            <div><label className="label">Rent</label><input type="number" className="input" required value={form.rent} onChange={(e) => setForm({ ...form, rent: e.target.value })} /></div>
            <div><label className="label">Electricity</label><input type="number" className="input" value={form.electricity} onChange={(e) => setForm({ ...form, electricity: e.target.value })} /></div>
            <div><label className="label">Water</label><input type="number" className="input" value={form.water} onChange={(e) => setForm({ ...form, water: e.target.value })} /></div>
            <div><label className="label">Maintenance</label><input type="number" className="input" value={form.maintenance} onChange={(e) => setForm({ ...form, maintenance: e.target.value })} /></div>
            <div><label className="label">Other charges</label><input type="number" className="input" value={form.other_charges} onChange={(e) => setForm({ ...form, other_charges: e.target.value })} /></div>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary flex-1" disabled={saving}>{saving ? "Creating..." : "Create invoice"}</button>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
