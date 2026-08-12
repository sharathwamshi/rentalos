import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import api from "../../api/client";
import { PageHeader, EmptyState, Spinner } from "../../components/ui";

export default function Notifications() {
  const [rows, setRows] = useState(null);
  const load = () => api.get("/tenant/notifications").then((r) => setRows(r.data));
  useEffect(() => { load(); }, []);

  const markRead = async (id) => { await api.post(`/tenant/notifications/${id}/read`); load(); };
  const markAll = async () => { await api.post("/tenant/notifications/read-all"); load(); };

  if (!rows) return <Spinner />;
  const unread = rows.filter((n) => !n.is_read).length;

  return (
    <div>
      <PageHeader title="Notifications" action={<button className="btn-secondary" onClick={markAll}>Mark all as read</button>} />
      {unread > 0 && <span className="pill-brand mb-4 inline-block">Unread: {unread}</span>}
      {rows.length === 0 ? (
        <div className="card"><EmptyState icon={Bell} title="No notifications" /></div>
      ) : (
        <div className="space-y-3">
          {rows.map((n) => (
            <div key={n.id} className={`card !p-4 flex items-start justify-between gap-4 ${!n.is_read ? "border-tenant-200 bg-cyan-50/40" : ""}`}>
              <div className="flex items-start gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${!n.is_read ? "bg-tenant-gradient text-white" : "bg-slate-100 text-slate-400"}`}>
                  <BellRing size={16} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-ink">{n.title}</p>
                  <p className="text-sm text-slate-600">{n.body}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </div>
              {!n.is_read && <button onClick={() => markRead(n.id)} className="btn-secondary !py-1.5 !px-3 text-xs shrink-0">Mark Read</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
