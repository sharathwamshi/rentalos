import { useEffect, useState } from "react";
import api from "../../api/client";
import { PageHeader, StatusPill, Spinner } from "../../components/ui";

export default function Owners() {
  const [rows, setRows] = useState(null);
  const load = () => api.get("/admin/owners").then((r) => setRows(r.data));
  useEffect(() => { load(); }, []);

  const toggle = async (id) => { await api.post(`/admin/owners/${id}/toggle-active`); load(); };

  if (!rows) return <Spinner />;

  return (
    <div>
      <PageHeader title="Owners" subtitle="Every property owner on the platform" />
      <div className="table-shell">
        <table className="data-table">
          <thead><tr><th>Owner</th><th>Email</th><th>Plan</th><th>Status</th><th>Properties</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td className="font-medium text-ink">{o.full_name}</td>
                <td>{o.email}</td>
                <td><span className="pill-brand">{o.plan || "—"}</span></td>
                <td><StatusPill status={o.subscription_status} /></td>
                <td>{o.properties_count}</td>
                <td>{o.created_at?.slice(0, 10)}</td>
                <td className="text-right">
                  <button onClick={() => toggle(o.id)} className={o.is_active ? "btn-secondary !py-1.5 !px-3 text-xs" : "btn-primary !py-1.5 !px-3 text-xs"}>
                    {o.is_active ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
