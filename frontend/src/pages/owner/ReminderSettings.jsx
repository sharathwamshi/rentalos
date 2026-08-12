import { useEffect, useState } from "react";
import api from "../../api/client";
import { PageHeader, Spinner } from "../../components/ui";

export default function ReminderSettings() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => { api.get("/owner/reminder-rules").then((r) => setForm(r.data)); }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/owner/reminder-rules", form);
      setOk(true);
      setTimeout(() => setOk(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <Spinner />;

  return (
    <div>
      <PageHeader title="Reminder Settings" subtitle="Configure automated rent reminders and late fees" />
      <form onSubmit={save} className="card max-w-2xl space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Days before due date to remind</label>
            <input type="number" className="input" value={form.days_before_due} onChange={(e) => setForm({ ...form, days_before_due: +e.target.value })} />
          </div>
          <div>
            <label className="label">Days after due date to mark overdue</label>
            <input type="number" className="input" value={form.days_after_due_for_overdue} onChange={(e) => setForm({ ...form, days_after_due_for_overdue: +e.target.value })} />
          </div>
        </div>

        <div>
          <p className="label mb-2">Reminder channels</p>
          <div className="flex flex-wrap gap-3">
            {[["channel_inapp", "In-app"], ["channel_whatsapp", "WhatsApp"], ["channel_sms", "SMS"], ["channel_telegram", "Telegram"]].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 cursor-pointer">
                <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} /> {label}
              </label>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Late fee (flat ₹)</label>
            <input type="number" className="input" value={form.late_fee_flat} onChange={(e) => setForm({ ...form, late_fee_flat: +e.target.value })} />
          </div>
          <div>
            <label className="label">Late fee (% of invoice)</label>
            <input type="number" className="input" value={form.late_fee_pct} onChange={(e) => setForm({ ...form, late_fee_pct: +e.target.value })} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save settings"}</button>
          {ok && <span className="text-sm text-emerald-600 font-medium">Saved.</span>}
        </div>
      </form>
    </div>
  );
}
