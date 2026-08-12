import { useEffect, useState } from "react";
import { Camera, ShieldCheck } from "lucide-react";
import api from "../../api/client";
import { PageHeader, Spinner } from "../../components/ui";

export default function TenantProfile() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [pwd, setPwd] = useState({ current_password: "", new_password: "", confirm: "" });
  const [pwdMsg, setPwdMsg] = useState("");

  useEffect(() => { api.get("/tenant/profile").then((r) => setForm(r.data)); }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/tenant/profile", form);
      setOk(true);
      setTimeout(() => setOk(false), 2000);
    } finally {
      setSaving(false);
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
      <PageHeader title="My Profile" subtitle="Manage your personal details and documents" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="rounded-xl bg-tenant-gradient text-white text-center py-8 -mx-6 -mt-6 mb-6">
            <div className="relative w-fit mx-auto">
              <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-display font-bold">
                {form.full_name?.[0]}
              </div>
              <button className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-tenant-600 flex items-center justify-center"><Camera size={13} /></button>
            </div>
            <p className="font-display font-bold mt-2">{form.full_name}</p>
            <p className="text-xs text-white/70">{form.email}</p>
          </div>

          <form onSubmit={save} className="space-y-6">
            <Section title="Account information">
              <F label="Full name" v={form.full_name} on={(v) => setForm({ ...form, full_name: v })} />
              <F label="Phone" v={form.phone} on={(v) => setForm({ ...form, phone: v })} />
            </Section>
            <Section title="Work & business">
              <F label="Occupation" v={form.occupation} on={(v) => setForm({ ...form, occupation: v })} />
              <F label="Company name" v={form.company_name} on={(v) => setForm({ ...form, company_name: v })} />
              <F label="GST Number" v={form.gst_number} on={(v) => setForm({ ...form, gst_number: v })} optional />
              <F label="PAN Number" v={form.pan_number} on={(v) => setForm({ ...form, pan_number: v })} optional />
            </Section>
            <Section title="Address">
              <TA label="Address" v={form.current_address} on={(v) => setForm({ ...form, current_address: v })} />
              <TA label="Permanent Address" v={form.permanent_address} on={(v) => setForm({ ...form, permanent_address: v })} />
            </Section>
            <Section title="ID & verification">
              <div>
                <label className="label">ID Proof Type</label>
                <select className="input" value={form.id_proof_type || ""} onChange={(e) => setForm({ ...form, id_proof_type: e.target.value })}>
                  <option value="">Select ID proof type</option><option>Aadhaar</option><option>PAN</option><option>Passport</option><option>Voter ID</option>
                </select>
              </div>
              <F label="ID Proof Number" v={form.id_proof_number} on={(v) => setForm({ ...form, id_proof_number: v })} />
              <div className="sm:col-span-2 flex items-center gap-3">
                <span className="label !mb-0">Police Verification Certificate</span>
                <button type="button" onClick={() => setForm({ ...form, police_verification: true })} className={`btn-secondary !py-1.5 !px-3 text-xs ${form.police_verification ? "!bg-emerald-50 !border-emerald-300 !text-emerald-700" : ""}`}>Yes</button>
                <button type="button" onClick={() => setForm({ ...form, police_verification: false })} className={`btn-secondary !py-1.5 !px-3 text-xs ${!form.police_verification ? "!bg-rose-50 !border-rose-300 !text-rose-700" : ""}`}>No</button>
              </div>
            </Section>
            <Section title="Emergency contact">
              <F label="Emergency Contact" v={form.emergency_contact_name} on={(v) => setForm({ ...form, emergency_contact_name: v })} />
              <F label="Emergency Phone" v={form.emergency_contact_phone} on={(v) => setForm({ ...form, emergency_contact_phone: v })} />
            </Section>
            <div className="flex items-center gap-3">
              <button className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
              {ok && <span className="text-sm text-emerald-600 font-medium">Saved.</span>}
            </div>
          </form>
        </div>

        <div className="card h-fit">
          <div className="flex items-center gap-2 mb-1"><ShieldCheck size={18} className="text-tenant-600" /><h3 className="font-display font-bold">Change Password</h3></div>
          <p className="text-xs text-slate-500 mb-4">Use a strong password with at least 8 characters.</p>
          <form onSubmit={changePassword} className="space-y-3">
            <div><label className="label">Current Password</label><input type="password" className="input" value={pwd.current_password} onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })} /></div>
            <div><label className="label">New Password</label><input type="password" className="input" value={pwd.new_password} onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })} /></div>
            <div><label className="label">Confirm Password</label><input type="password" className="input" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} /></div>
            {pwdMsg && <p className={`text-xs ${pwdMsg.includes("updated") ? "text-emerald-600" : "text-rose-600"}`}>{pwdMsg}</p>}
            <button className="btn-primary w-full"><ShieldCheck size={15} /> Update Password</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-tenant-600 mb-3">{title}</p>
      <div className="grid sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}
function F({ label, v, on, optional }) {
  return <div><label className="label">{label}{optional && <span className="normal-case font-normal text-slate-400"> (optional)</span>}</label><input className="input" value={v || ""} onChange={(e) => on(e.target.value)} /></div>;
}
function TA({ label, v, on }) {
  return <div className="sm:col-span-2"><label className="label">{label}</label><textarea className="input" rows={2} value={v || ""} onChange={(e) => on(e.target.value)} /></div>;
}
