import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, KeyRound } from "lucide-react";
import api from "../../api/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
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

        <div className="h-12 w-12 rounded-xl bg-brand-gradient-soft flex items-center justify-center mb-4">
          <KeyRound size={22} className="text-brand-600" />
        </div>
        <h2 className="text-2xl font-display font-extrabold text-ink">Reset your password</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          Enter your account email and we'll text you a reset link.
        </p>

        {sent ? (
          <div className="rounded-lg bg-emerald-50 text-emerald-700 text-sm px-3.5 py-3">
            If that email exists, a reset link has been sent. Check your phone for an SMS with the link.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"} <ArrowRight size={16} />
            </button>
          </form>
        )}

        <p className="text-sm text-slate-500 mt-6 text-center">
          <Link to="/login" className="font-semibold text-brand-600">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
