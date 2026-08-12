import { useEffect, useState } from "react";
import { Plus, FileDown, Eye, Receipt } from "lucide-react";
import api from "../../api/client";
import { PageHeader, Modal, EmptyState, StatusPill, Spinner } from "../../components/ui";

export default function Invoices() {
  const [rows, setRows] = useState(null);
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState({ tenant_id: "", room_id: "", billing_month: "", due_date: "", rent: "", electricity: 0, water: 0, maintenance: 0, other_charges: 0 });
  const [payForm, setPayForm] = useState({ amount: "", method: "cash", reference: "", notes: "" });
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

  const openView = async (id) => {
    const { data } = await api.get(`/owner/invoices/${id}`);
    setView(data);
    setPayForm({ amount: data.balance, method: "cash", reference: "", notes: "" });
  };

  const addPayment = async (e) => {
    e.preventDefault();
    await api.post(`/owner/invoices/${view.id}/payments`, payForm);
    const { data } = await api.get(`/owner/invoices/${view.id}`);
    setView(data);
    load();
  };

  const markPaid = async (id) => { await api.post(`/owner/invoices/${id}/mark-paid`); load(); if (view) openView(view.id); };
  const downloadPdf = (id) => window.open(`/api/owner/invoices/${id}/pdf`, "_blank");

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
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openView(i.id)} className="text-slate-400 hover:text-brand-600"><Eye size={16} /></button>
                      <button onClick={() => downloadPdf(i.id)} className="text-slate-400 hover:text-brand-600"><FileDown size={16} /></button>
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

      <Modal open={!!view} onClose={() => setView(null)} title={view?.invoice_number} wide>
        {view && (
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-sm">Charges</p><StatusPill status={view.status} />
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Rent</span><span>₹{view.rent}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Electricity</span><span>₹{view.electricity}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Water</span><span>₹{view.water}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Maintenance</span><span>₹{view.maintenance}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Late fee</span><span>₹{view.late_fee}</span></div>
                <div className="flex justify-between font-bold border-t pt-1.5 mt-1.5"><span>Total</span><span>₹{view.total}</span></div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[["Subtotal", view.total], ["Paid", view.paid_amount], ["Balance", view.balance]].map(([l, v]) => (
                  <div key={l} className="rounded-lg bg-slate-50 p-2.5 text-center">
                    <p className="text-[10px] uppercase text-slate-400 font-semibold">{l}</p>
                    <p className="font-mono font-bold text-sm">₹{v}</p>
                  </div>
                ))}
              </div>
              {view.status !== "paid" && (
                <button onClick={() => markPaid(view.id)} className="btn-secondary w-full mt-3 text-xs !py-2">Mark as paid</button>
              )}
            </div>
            <div>
              <p className="font-semibold text-sm mb-3">Add payment</p>
              <form onSubmit={addPayment} className="space-y-3">
                <div><label className="label">Amount</label><input type="number" className="input" required value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} /></div>
                <div><label className="label">Method</label><input className="input" placeholder="cash, bank_transfer..." value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })} /></div>
                <div><label className="label">Reference</label><input className="input" value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} /></div>
                <div><label className="label">Notes</label><textarea className="input" rows={2} value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} /></div>
                <button className="btn-primary w-full">Add payment</button>
              </form>
              <p className="font-semibold text-sm mt-5 mb-2">Payment history</p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {view.payments.length === 0 ? <p className="text-xs text-slate-400">No payments found.</p> :
                  view.payments.map((p, i) => (
                    <div key={i} className="flex justify-between text-xs border-b border-slate-50 pb-1.5">
                      <span>{p.method} — {p.paid_at?.slice(0, 10)}</span><span className="font-mono">₹{p.amount}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
