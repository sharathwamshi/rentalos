import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";
import api from "../../api/client";
import { PageHeader, EmptyState, StatusPill, Spinner } from "../../components/ui";

const NEXT_STATUS = { open: "in_progress", in_progress: "resolved", resolved: "closed" };

export default function Maintenance() {
  const [rows, setRows] = useState(null);
  const load = () => api.get("/owner/maintenance").then((r) => setRows(r.data));
  useEffect(() => { load(); }, []);

  const advance = async (t) => {
    const next = NEXT_STATUS[t.status];
    if (!next) return;
    await api.put(`/owner/maintenance/${t.id}`, { status: next });
    load();
  };

  if (!rows) return <Spinner />;

  return (
    <div>
      <PageHeader title="Maintenance" subtitle="Tickets raised by your tenants" />
      {rows.length === 0 ? (
        <div className="card"><EmptyState icon={Wrench} title="No maintenance requests" subtitle="Tickets your tenants raise will show up here." /></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {rows.map((t) => (
            <div key={t.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm text-ink">{t.title}</p>
                  <p className="text-xs text-slate-400">{t.tenant_name} · {t.unit}</p>
                </div>
                <StatusPill status={t.status} />
              </div>
              <p className="text-sm text-slate-600 mb-3">{t.description}</p>
              <div className="flex items-center justify-between">
                <span className="pill-neutral capitalize">{t.category} · {t.priority}</span>
                {NEXT_STATUS[t.status] && (
                  <button className="btn-secondary !py-1.5 !px-3 text-xs" onClick={() => advance(t)}>
                    Mark {NEXT_STATUS[t.status].replace("_", " ")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
