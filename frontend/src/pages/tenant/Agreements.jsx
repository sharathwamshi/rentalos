import { useEffect, useState } from "react";
import { FileDown, FileText, PenLine } from "lucide-react";
import api from "../../api/client";
import { PageHeader, Modal, EmptyState, StatusPill, Spinner } from "../../components/ui";

export default function TenantAgreements() {
  const [rows, setRows] = useState(null);
  const [view, setView] = useState(null);
  const [signName, setSignName] = useState("");
  const [renewals, setRenewals] = useState([]);

  const load = () => {
    api.get("/tenant/agreements").then((r) => setRows(r.data));
    api.get("/tenant/renewals").then((r) => setRenewals(r.data.filter((x) => x.status === "pending")));
  };
  useEffect(() => { load(); }, []);

  const openView = async (id) => {
    const { data } = await api.get(`/tenant/agreements/${id}`);
    setView({ ...data, id });
  };

  const sign = async () => {
    try {
      await api.post(`/tenant/agreements/${view.id}/sign`, { signature_name: signName });
      setView(null); setSignName(""); load();
    } catch (err) {
      alert(err.response?.data?.error || "Could not sign.");
    }
  };

  const respondRenewal = async (id, status) => {
    await api.post(`/tenant/renewals/${id}/respond`, { status });
    load();
  };

  if (!rows) return <Spinner />;

  return (
    <div>
      <PageHeader title="Rental Agreements" subtitle="Your lease agreements and e-signature status" />

      {renewals.length > 0 && (
        <div className="card mb-6 border-amber-200 bg-amber-50/50">
          <h3 className="font-display font-bold text-amber-800 mb-3">Renewal proposal from your owner</h3>
          {renewals.map((r) => (
            <div key={r.id} className="flex items-center justify-between bg-white rounded-lg p-3 mb-2 last:mb-0">
              <p className="text-sm">New rent <b>₹{r.proposed_rent}</b> · {r.proposed_start} → {r.proposed_end}</p>
              <div className="flex gap-2">
                <button className="btn-primary !py-1.5 !px-3 text-xs" onClick={() => respondRenewal(r.id, "accepted")}>Accept</button>
                <button className="btn-secondary !py-1.5 !px-3 text-xs" onClick={() => respondRenewal(r.id, "declined")}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="card"><EmptyState icon={FileText} title="No agreements yet" /></div>
      ) : (
        <div className="table-shell">
          <table className="data-table">
            <thead><tr><th>Agreement No</th><th>Unit</th><th>Period</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="font-medium text-ink">{a.agreement_number}</td>
                  <td>{a.unit}</td>
                  <td>{a.start_date} – {a.end_date}</td>
                  <td>
                    {a.is_uploaded ? <span className="pill-brand">Uploaded</span> : <StatusPill status={a.status} />}
                  </td>
                  <td>
                    <div className="flex gap-2 justify-end">
                      <button className="btn-secondary !py-1.5 !px-3 text-xs" onClick={() => openView(a.id)}>View</button>
                      <button onClick={() => window.open(`/api/owner/agreements/${a.id}/pdf?token=${encodeURIComponent(localStorage.getItem("access_token") || "")}`, "_blank")} className="text-slate-400 hover:text-tenant-600"><FileDown size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!view} onClose={() => setView(null)} title="Agreement details" wide>
        {view && (
          <div>
            <div className="grid sm:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-xs font-bold uppercase text-tenant-600 mb-2">Agreement details</p>
                <Row l="Agreement number" v={view.agreement_number} /><Row l="Rent type" v={view.rent_type} />
                <Row l="Start date" v={view.start_date} /><Row l="End date" v={view.end_date} />
                <Row l="Monthly rent" v={`₹${view.monthly_rent}`} /><Row l="Security deposit" v={`₹${view.security_deposit}`} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-tenant-600 mb-2">Unit / property</p>
                <Row l="Property" v={view.property} /><Row l="Unit number" v={view.unit_number} /><Row l="Location" v={view.location} />
              </div>
            </div>
            {view.is_uploaded ? (
              <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 flex items-center gap-3">
                <FileDown size={18} className="text-brand-600 shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-ink">This agreement was uploaded by your owner</p>
                  <p className="text-xs text-slate-500">Already signed outside RentalOS — no action needed. Download it below anytime.</p>
                </div>
              </div>
            ) : !view.tenant_signed ? (
              <div className="rounded-xl border border-tenant-200 bg-cyan-50/50 p-4">
                <div className="flex items-center gap-2 mb-2"><PenLine size={16} className="text-tenant-600" /><p className="font-semibold text-sm">Sign this agreement</p></div>
                <p className="text-xs text-slate-500 mb-3">Type your full legal name exactly as on file to accept.</p>
                <div className="flex gap-2">
                  <input className="input" placeholder="Your full name" value={signName} onChange={(e) => setSignName(e.target.value)} />
                  <button className="btn-primary shrink-0" onClick={sign}>Sign</button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-emerald-600 font-medium">✅ You have signed this agreement.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ l, v }) {
  return <div className="flex justify-between text-sm py-1"><span className="text-slate-400">{l}</span><span className="font-medium">{v}</span></div>;
}
