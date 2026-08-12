import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import api from "../../api/client";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: password });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "This reset link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-8">
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-display font-extrabold text-ink">Set a new password</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">Use at least 8 characters.</p>
        {error && <div className="mb-4 rounded-lg bg-rose-50 text-rose-700 text-sm px-3.5 py-2.5">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">New password</label>
            <input className="input" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Saving..." : "Update password"} <ArrowRight size={16} />
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-6 text-center">
          <Link to="/login" className="font-semibold text-brand-600">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
