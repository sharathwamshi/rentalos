import { useEffect, useState } from "react";
import { FileDown, Receipt, CreditCard } from "lucide-react";
import api from "../../api/client";
import { PageHeader, Modal, EmptyState, StatusPill, Spinner } from "../../components/ui";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function TenantInvoices() {
  const [rows, setRows] = useState(null);
  const [status, setStatus] = useState("all");
  const [view, setView] = useState(null);
  const [payError, setPayError] = useState("");

  const load = () => api.get("/tenant/invoices", { params: { status } }).then((r) => setRows(r.data));
  useEffect(() => { load(); }, [status]);

  const openView = async (id) => {
    const { data } = await api.get(`/tenant/invoices/${id}`);
    setView({ ...data, id });
    setPayError("");
  };

  const payNow = async () => {
    setPayError("");
    try {
      const { data } = await api.post(`/tenant/invoices/${view.id}/pay/create-order`);
      const loaded = await loadRazorpayScript();
      if (!loaded) { setPayError("Could not load payment gateway. Check your connection."); return; }
      const rzp = new window.Razorpay({
        key: data.order.notes?.key_id || "",
        amount: data.order.amount,
        currency: "INR",
        name: "RentalOS",
        description: view.invoice_number,
        order_id: data.order.id,
        handler: async (response) => {
          await api.post(`/tenant/invoices/${view.id}/pay/verify`, {
            order_id: response.razorpay_order_id,
            payment_id: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            amount: view.balance,
          });
          openView(view.id);
          load();
        },
        theme: { color: "#0891B2" },
      });
      rzp.open();
    } catch (err) {
      setPayError(err.response?.data?.error || "Online payments aren't available right now.");
    }
  };

  if (!rows) return <Spinner />;

  return (
    <div>
      <PageHeader title="Invoices & Billing" subtitle="Your rent invoices and payment history" />
      <div className="table-shell">
        <div className="p-4 border-b border-slate-100">
          <select className="input max-w-[180px]" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Status: all</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="overdue">Overdue</option>
          </select>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={Receipt} title="No invoices yet" />
        ) : (
          <table className="data-table">
            <thead><tr><th>Invoice</th><th>Month</th><th>Unit</th><th>Due date</th><th>Total</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id}>
                  <td className="font-medium text-ink">{i.invoice_number}</td>
                  <td>{i.billing_month}</td><td>{i.unit}</td><td>{i.due_date}</td>
                  <td className="font-mono">₹{i.total.toLocaleString("en-IN")}</td>
                  <td><StatusPill status={i.status} /></td>
                  <td>
                    <div className="flex gap-2 justify-end">
                      <button className="btn-secondary !py-1.5 !px-3 text-xs" onClick={() => openView(i.id)}>View</button>
                      <button onClick={() => window.open(`/api/tenant/invoices/${i.id}/pdf?token=${encodeURIComponent(localStorage.getItem("access_token") || "")}`, "_blank")} className="text-slate-400 hover:text-tenant-600"><FileDown size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!view} onClose={() => setView(null)} title={view?.invoice_number}>
        {view && (
          <div>
            <div className="flex items-center justify-between mb-3"><p className="font-semibold text-sm">Charges</p><StatusPill status={view.status} /></div>
            <div className="space-y-1.5 text-sm mb-4">
              <Row l="Rent" v={view.rent} /><Row l="Electricity" v={view.electricity} /><Row l="Water" v={view.water} /><Row l="Maintenance" v={view.maintenance} />
              <div className="flex justify-between font-bold border-t pt-1.5 mt-1.5"><span>Total</span><span>₹{view.total}</span></div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[["Subtotal", view.total], ["Paid", view.paid_amount], ["Balance", view.balance]].map(([l, v]) => (
                <div key={l} className="rounded-lg bg-slate-50 p-2.5 text-center">
                  <p className="text-[10px] uppercase text-slate-400 font-semibold">{l}</p><p className="font-mono font-bold text-sm">₹{v}</p>
                </div>
              ))}
            </div>
            {view.status !== "paid" && (
              <>
                <button onClick={payNow} className="btn-primary w-full !bg-tenant-gradient"><CreditCard size={16} /> Pay ₹{view.balance} now</button>
                {payError && <p className="text-xs text-rose-600 mt-2">{payError}</p>}
              </>
            )}
            <p className="font-semibold text-sm mt-5 mb-2">Payment history</p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {view.payments.length === 0 ? <p className="text-xs text-slate-400">No payments found.</p> :
                view.payments.map((p, i) => (
                  <div key={i} className="flex justify-between text-xs border-b border-slate-50 pb-1.5"><span>{p.method} — {p.paid_at?.slice(0, 10)}</span><span className="font-mono">₹{p.amount}</span></div>
                ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ l, v }) {
  return <div className="flex justify-between"><span className="text-slate-500">{l}</span><span>₹{v}</span></div>;
}
