import { useEffect, useState } from "react";
import { MessageCircle, Send, CreditCard, Settings as SettingsIcon, CheckCircle2, XCircle } from "lucide-react";
import api from "../../api/client";
import { PageHeader, Spinner } from "../../components/ui";

const GROUPS = [
  {
    key: "twilio", title: "Twilio (SMS)", icon: MessageCircle, color: "bg-red-500",
    desc: "Used for password-reset links and optional SMS reminders.",
    fields: [["twilio_account_sid", "Account SID", "text"], ["twilio_auth_token", "Auth Token", "password"], ["twilio_sms_from", "SMS From Number", "text"]],
  },
  {
    key: "whatsapp", title: "WhatsApp (via Twilio)", icon: Send, color: "bg-emerald-500",
    desc: "Used for rent reminders, ticket updates, and messages.",
    fields: [["twilio_whatsapp_from", "WhatsApp From (e.g. whatsapp:+14155238886)", "text"]],
  },
  {
    key: "telegram", title: "Telegram Bot", icon: Send, color: "bg-sky-500",
    desc: "Owners and tenants can link their Telegram to receive alerts.",
    fields: [["telegram_bot_token", "Bot Token", "password"]],
  },
  {
    key: "razorpay", title: "Razorpay (Payments)", icon: CreditCard, color: "bg-indigo-500",
    desc: "Powers the tenant 'Pay Now' button and owner subscription billing.",
    fields: [["razorpay_key_id", "Key ID", "text"], ["razorpay_key_secret", "Key Secret", "password"]],
  },
];

export default function IntegrationSettings() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);

  const load = () => api.get("/admin/settings").then((r) => setSettings(r.data));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/admin/settings", form);
      setForm({});
      setOk(true);
      load();
      setTimeout(() => setOk(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <Spinner />;

  return (
    <div>
      <PageHeader title="Integration Settings" subtitle="Connect Telegram, WhatsApp, Twilio and payment providers for the whole platform" />
      <form onSubmit={save} className="space-y-6">
        {GROUPS.map((g) => (
          <div key={g.key} className="card">
            <div className="flex items-start gap-3 mb-4">
              <div className={`h-10 w-10 rounded-xl ${g.color} text-white flex items-center justify-center shrink-0`}><g.icon size={18} /></div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold">{g.title}</h3>
                  {g.fields.every(([k]) => settings[k]?.configured) ? (
                    <span className="pill-success !text-[10px]"><CheckCircle2 size={11} /> Configured</span>
                  ) : (
                    <span className="pill-neutral !text-[10px]"><XCircle size={11} /> Not configured</span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{g.desc}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {g.fields.map(([key, label, type]) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input
                    type={type}
                    className="input"
                    placeholder={settings[key]?.value || "Not set"}
                    value={form[key] ?? ""}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-slate-700 text-white flex items-center justify-center"><SettingsIcon size={18} /></div>
            <h3 className="font-display font-bold">General</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label">App Name</label><input className="input" placeholder={settings.app_name?.value} value={form.app_name ?? ""} onChange={(e) => setForm({ ...form, app_name: e.target.value })} /></div>
            <div><label className="label">Support Email</label><input className="input" placeholder={settings.support_email?.value} value={form.support_email ?? ""} onChange={(e) => setForm({ ...form, support_email: e.target.value })} /></div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save all settings"}</button>
          {ok && <span className="text-sm text-emerald-600 font-medium">Settings saved.</span>}
        </div>
        <p className="text-xs text-slate-400">Fields left blank keep their current stored value — you never need to re-enter a secret you're not changing.</p>
      </form>
    </div>
  );
}
