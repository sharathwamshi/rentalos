import { useEffect, useState } from "react";
import { ShieldCheck, Camera, Crown } from "lucide-react";
import api from "../../api/client";
import { PageHeader, Spinner } from "../../components/ui";

export default function OwnerProfile() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [panUploading, setPanUploading] = useState(false);
  const [pwd, setPwd] = useState({ current_password: "", new_password: "", confirm: "" });
  const [pwdMsg, setPwdMsg] = useState("");

  useEffect(() => { api.get("/owner/profile").then((r) => setForm(r.data)); }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/owner/profile", form);
      setOk(true);
      setTimeout(() => setOk(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const uploadFile = async (file, folder, field, setUploading) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const { data } = await api.post("/uploads", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((f) => ({ ...f, [field]: data.url }));
    } finally {
      setUploading(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwdMsg("");
    if (pwd.new_password !== pwd.confirm) {
      setPwdMsg("New passwords don't match.");
      return;
    }
    try {
      await api.post("/auth/change-password", pwd);
      setPwdMsg("Password updated.");
      setPwd({ current_password: "", new_password: "", confirm: "" });
    } catch (err) {
      setPwdMsg(err.response?.data?.error || "Could not update password.");
    }
  };

  if (!form) return <Spinner />;

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your account and property details" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="rounded-xl bg-brand-gradient text-white text-center py-8 -mx-6 -mt-6 mb-6">
            <p className="text-sm font-medium text-white/90 mb-4">Manage your account and property details</p>
            <div className="relative w-fit mx-auto">
              <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-display font-bold overflow-hidden">
                {form.business_logo_url ? <img src={form.business_logo_url} alt="" className="h-full w-full object-cover" /> : form.full_name?.[0]}
              </div>
              <label className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-brand-700 flex items-center justify-center cursor-pointer">
                <Camera size={13} />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && uploadFile(e.target.files[0], "owner-logo", "business_logo_url", setLogoUploading)} />
              </label>
            </div>
            <p className="font-display font-bold mt-3">{form.full_name}</p>
            <p className="text-xs text-white/70">{form.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              <Crown size={12} /> {form.plan_name || "No"} Membership
            </span>
          </div>

          <form onSubmit={save} className="space-y-6">
            <Section title="Account information">
              <F label="Name" v={form.full_name} on={(v) => setForm({ ...form, full_name: v })} required />
              <F label="Email" v={form.email} disabled />
              <F label="Phone Number" v={form.phone} on={(v) => setForm({ ...form, phone: v })} required />
            </Section>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-600 mb-3">Business logo</p>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center bg-slate-50 shrink-0">
                  {form.business_logo_url ? <img src={form.business_logo_url} alt="" className="h-full w-full object-cover" /> : <span className="text-xs text-slate-400">No logo</span>}
                </div>
                <div className="flex-1">
                  <label className="label">Upload logo</label>
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="input"
                    onChange={(e) => e.target.files[0] && uploadFile(e.target.files[0], "owner-logo", "business_logo_url", setLogoUploading)} />
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG or WEBP. Max 4MB. Used on invoices and agreements.{logoUploading && " Uploading..."}</p>
                </div>
              </div>
            </div>

            <Section title="Property & ownership">
              <div className="sm:col-span-2">
                <label className="label">Property Address</label>
                <textarea className="input" rows={2} required value={form.property_address || ""} onChange={(e) => setForm({ ...form, property_address: e.target.value })} />
              </div>
              <F label="GST Details" v={form.gst_number} on={(v) => setForm({ ...form, gst_number: v })} />
              <div>
                <label className="label">Ownership Type</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setForm({ ...form, ownership_type: "single" })}
                    className={`btn-secondary flex-1 !py-2 text-xs ${form.ownership_type === "single" ? "!bg-brand-50 !border-brand-400 !text-brand-700" : ""}`}>Single</button>
                  <button type="button" onClick={() => setForm({ ...form, ownership_type: "joint" })}
                    className={`btn-secondary flex-1 !py-2 text-xs ${form.ownership_type === "joint" ? "!bg-brand-50 !border-brand-400 !text-brand-700" : ""}`}>Joint</button>
                </div>
              </div>
              <F label="Invoice Prefix" v={form.invoice_prefix} on={(v) => setForm({ ...form, invoice_prefix: v })} placeholder={`INV-${new Date().getFullYear()}`} />
              {form.ownership_type === "joint" && (
                <div>
                  <label className="label">Joint Level</label>
                  <select className="input" value={form.joint_level || ""} onChange={(e) => setForm({ ...form, joint_level: e.target.value })}>
                    <option value="">Select level</option>
                    <option value="Level 1">Level 1</option>
                    <option value="Level 2">Level 2</option>
                    <option value="Level 3">Level 3</option>
                  </select>
                </div>
              )}
              <F label="PAN Number" v={form.pan_number} on={(v) => setForm({ ...form, pan_number: v })} />
              <div>
                <label className="label">PAN Upload</label>
                <input type="file" accept=".pdf,image/*" className="input"
                  onChange={(e) => e.target.files[0] && uploadFile(e.target.files[0], "owner-pan", "pan_upload_url", setPanUploading)} />
                {form.pan_upload_url && <p className="text-xs text-emerald-600 mt-1">File uploaded.{panUploading && " Uploading..."}</p>}
              </div>
            </Section>

            <div className="flex items-center gap-3">
              <button type="button" className="btn-secondary" onClick={() => window.location.reload()}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
              {ok && <span className="text-sm text-emerald-600 font-medium">Saved.</span>}
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-1"><ShieldCheck size={18} className="text-brand-600" /><h3 className="font-display font-bold">Change Password</h3></div>
            <p className="text-xs text-slate-500 mb-4">Use a strong password with at least 8 characters.</p>
            <form onSubmit={changePassword} className="space-y-3">
              <div><label className="label">Current Password</label><input type="password" className="input" value={pwd.current_password} onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })} /></div>
              <div><label className="label">New Password</label><input type="password" className="input" value={pwd.new_password} onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })} /></div>
              <div><label className="label">Confirm Password</label><input type="password" className="input" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} /></div>
              {pwdMsg && <p className={`text-xs ${pwdMsg.includes("updated") ? "text-emerald-600" : "text-rose-600"}`}>{pwdMsg}</p>}
              <button className="btn-primary w-full"><ShieldCheck size={15} /> Update Password</button>
            </form>
          </div>

          <div className="card">
            <h3 className="font-display font-bold mb-4">Account Summary</h3>
            <Row l="Member since" v={new Date(form.member_since).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })} />
            <Row l="Membership" v={form.plan_name || "—"} />
            <Row l="Ownership" v={`${form.ownership_type === "joint" ? "Joint" : "Single"}${form.joint_level ? " · " + form.joint_level : ""}`} />
            <button className="btn-primary w-full mt-4" onClick={() => window.location.assign("/owner/subscription")}>
              <Crown size={15} /> Upgrade Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-brand-600 mb-3">{title}</p>
      <div className="grid sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}
function F({ label, v, on, disabled, required, placeholder }) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-rose-500"> *</span>}</label>
      <input className="input" value={v || ""} disabled={disabled} placeholder={placeholder}
        onChange={on ? (e) => on(e.target.value) : undefined} />
    </div>
  );
}
function Row({ l, v }) {
  return (
    <div className="flex justify-between py-1.5 text-sm border-b border-slate-50 last:border-0">
      <span className="text-slate-400">{l}</span><span className="font-medium text-ink">{v}</span>
    </div>
  );
}
