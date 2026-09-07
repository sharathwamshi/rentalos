import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FileDown, ArrowLeft, CheckCircle2 } from "lucide-react";
import api from "../../api/client";
import { StatusPill, Spinner } from "../../components/ui";

function pdfUrl(path) {
  const token = localStorage.getItem("access_token");
  return `${path}?token=${encodeURIComponent(token || "")}`;
}

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [payForm, setPayForm] = useState({ amount: "", method: "", reference: "", paid_at: new Date().toISOString().slice(0, 16), notes: "" });
  const [saving, setSaving] = useState(false);

  const load = () => api.get(`/owner/invoices/${id}`).then((r) => {
    setInvoice(r.data);
    setPayForm((f) => ({ ...f, amount: r.data.balance }));
  });
  useEffect(() => { load(); }, [id]);

  const addPayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/owner/invoices/${id}/payments`, payForm);
      load();
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async () => {
    await api.post(`/owner/invoices/${id}/mark-paid`);
    load();
  };

  if (!invoice) return <Spinner />;

  const charges = [
    ["Rent", invoice.rent],
    ["Electricity", invoice.electricity],
    ["Water", invoice.water],
    ["Maintenance", invoice.maintenance],
    ["Other charges", invoice.other_charges],
  ];
  if (invoice.late_fee > 0) charges.push(["Late fee", invoice.late_fee]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-ink"><ArrowLeft size={20} /></button>
          <h1 className="text-xl font-display font-extrabold text-ink tracking-wide">VIEW INVOICE</h1>
        </div>
        <div className="flex gap-2">
          <a href={pdfUrl(`/api/owner/invoices/${id}/pdf`)} target="_blank" rel="noreferrer" className="btn-secondary !py-2 !px-4 text-sm">PDF</a>
          <button onClick={() => navigate(-1)} className="btn-secondary !py-2 !px-4 text-sm">Back</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold">Charges</h3>
              <StatusPill status={invoice.status} />
            </div>
            <div className="space-y-2 text-sm mb-4">
              {charges.map(([l, v]) => (
                <div key={l} className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">{l}</span>
                  <span className="font-mono">₹{Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-1">
                <span>Total</span>
                <span className="font-mono">₹{Number(invoice.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[["Subtotal", invoice.total], ["Paid", invoice.paid_amount], ["Balance", invoice.balance]].map(([l, v]) => (
                <div key={l} className="rounded-lg bg-slate-50 p-3 text-center">
                  <p className="text-[10px] uppercase text-slate-400 font-semibold">{l}</p>
                  <p className="font-mono font-bold text-sm">₹{Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                </div>
              ))}
            </div>
            {invoice.status !== "paid" && (
              <button onClick={markPaid} className="btn-secondary w-full mt-4 text-sm">
                <CheckCircle2 size={16} /> Mark as paid
              </button>
            )}
          </div>

          <div className="card">
            <h3 className="font-display font-bold mb-4">Payments</h3>
            <form onSubmit={addPayment} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Amount</label><input type="number" className="input" required value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} /></div>
                <div><label className="label">Method</label><input className="input" placeholder="cash, bank_transfer..." value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Reference</label><input className="input" value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} /></div>
                <div><label className="label">Paid at</label><input type="datetime-local" className="input" value={payForm.paid_at} onChange={(e) => setPayForm({ ...payForm, paid_at: e.target.value })} /></div>
              </div>
              <div><label className="label">Notes</label><textarea className="input" rows={2} placeholder="Optional notes" value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} /></div>
              <button className="btn-primary w-full" disabled={saving}>{saving ? "Adding..." : "Add payment"}</button>
            </form>

            {invoice.payments.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase">Payment history</p>
                {invoice.payments.map((p, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span>{p.method} — {p.paid_at?.slice(0, 10)}</span>
                    <span className="font-mono">₹{p.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-display font-bold mb-4">Invoice details</h3>
            <Row l="Invoice number" v={invoice.invoice_number} />
            <Row l="Billing month" v={invoice.billing_month} />
            <Row l="Due date" v={invoice.due_date} />
            <Row l="Paid date" v={invoice.paid_date || "—"} />
            <Row l="Rent type" v={invoice.rent_type} />
            <Row l="Status" v={<StatusPill status={invoice.status} />} />
          </div>

          <div className="card">
            <h3 className="font-display font-bold mb-4">Tenant</h3>
            <Row l="Name" v={invoice.tenant_name} link />
            <Row l="Email" v={invoice.tenant_email} />
            <Row l="Phone" v={invoice.tenant_phone} />
          </div>

          <div className="card">
            <h3 className="font-display font-bold mb-4">Unit / agreement</h3>
            <Row l="Property" v={invoice.property_name} link />
            <Row l="Unit number" v={invoice.unit_number} />
            <Row l="Location" v={invoice.property_location} />
            <Row l="Agreement" v={invoice.agreement_number || "—"} link />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ l, v, link }) {
  return (
    <div className="flex justify-between py-1.5 text-sm border-b border-slate-50 last:border-0">
      <span className="text-slate-400">{l}</span>
      <span className={`font-medium ${link ? "text-brand-600" : "text-ink"}`}>{v}</span>
    </div>
  );
}
