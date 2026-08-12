import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-surface">
      <div className="hidden lg:flex flex-col justify-between bg-brand-gradient text-white p-12 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-24 -bottom-24 h-96 w-96 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center font-display font-extrabold">R</div>
          <span className="font-display font-extrabold text-xl">RentalOS</span>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-display font-extrabold leading-tight max-w-md">
            Run every property, tenant, and rupee from one place.
          </h1>
          <p className="mt-4 text-white/80 max-w-sm">
            Agreements, invoices, maintenance and reminders — built for landlords managing real portfolios in India.
          </p>
        </div>
        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} RentalOS. All rights reserved.</p>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="h-9 w-9 rounded-lg bg-brand-gradient text-white flex items-center justify-center font-display font-extrabold">R</div>
            <span className="font-display font-extrabold text-xl">RentalOS</span>
          </div>

          <h2 className="text-2xl font-display font-extrabold text-ink">Welcome back</h2>
          <p className="text-sm text-slate-500 mt-1 mb-8">Sign in to continue to your dashboard.</p>

          {error && <div className="mb-4 rounded-lg bg-rose-50 text-rose-700 text-sm px-3.5 py-2.5">{error}</div>}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label !mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                  Forgot password?
                </Link>
              </div>
              <input className="input" type="password" required value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </div>
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"} <ArrowRight size={16} />
            </button>
          </form>

          <p className="text-sm text-slate-500 mt-6 text-center">
            New here? <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
