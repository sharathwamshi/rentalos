import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, User } from "lucide-react";
import api from "../../api/client";

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState("owner");
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", { ...form, role });
      setOk("Account created! Redirecting to sign in...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-8">
      <div className="w-full max-w-sm">
        <Link to="/login" className="flex items-center gap-2.5 mb-8 w-fit">
          <div className="h-9 w-9 rounded-lg bg-brand-gradient text-white flex items-center justify-center font-display font-extrabold">R</div>
          <span className="font-display font-extrabold text-xl">RentalOS</span>
        </Link>

        <h2 className="text-2xl font-display font-extrabold text-ink">Create your account</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">Choose how you'll use RentalOS.</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setRole("owner")}
            className={`rounded-xl border-2 p-4 text-left transition ${role === "owner" ? "border-brand-500 bg-brand-50" : "border-slate-200"}`}
          >
            <Building2 size={20} className={role === "owner" ? "text-brand-600" : "text-slate-400"} />
            <p className="font-semibold text-sm mt-2">I'm a Property Owner</p>
            <p className="text-xs text-slate-500">Manage properties & tenants</p>
          </button>
          <button
            onClick={() => setRole("tenant")}
            className={`rounded-xl border-2 p-4 text-left transition ${role === "tenant" ? "border-tenant-500 bg-cyan-50" : "border-slate-200"}`}
          >
            <User size={20} className={role === "tenant" ? "text-tenant-600" : "text-slate-400"} />
            <p className="font-semibold text-sm mt-2">I'm a Tenant</p>
            <p className="text-xs text-slate-500">Pay rent & manage my room</p>
          </button>
        </div>

        {error && <div className="mb-4 rounded-lg bg-rose-50 text-rose-700 text-sm px-3.5 py-2.5">{error}</div>}
        {ok && <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-700 text-sm px-3.5 py-2.5">{ok}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"} <ArrowRight size={16} />
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-6 text-center">
          Already have an account? <Link to="/login" className="font-semibold text-brand-600">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
