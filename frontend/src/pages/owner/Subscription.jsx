import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import api from "../../api/client";
import { PageHeader, Spinner } from "../../components/ui";

export default function Subscription() {
  const [data, setData] = useState(null);
  const [switching, setSwitching] = useState(null);

  const load = () => api.get("/owner/subscription").then((r) => setData(r.data));
  useEffect(() => { load(); }, []);

  const changePlan = async (planId) => {
    setSwitching(planId);
    try {
      await api.post("/owner/subscription/change-plan", { plan_id: planId });
      load();
    } finally {
      setSwitching(null);
    }
  };

  if (!data) return <Spinner />;

  return (
    <div>
      <PageHeader title="Subscription" subtitle="Choose a plan that fits your usage. All plans are billed monthly." />

      <div className="card mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase">Current plan</p>
          <p className="text-lg font-display font-bold text-ink">{data.current_plan || "No plan"}</p>
        </div>
        <span className="pill-brand capitalize">{data.status}</span>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {data.plans.map((p) => {
          const isCurrent = p.name === data.current_plan;
          return (
            <div key={p.id} className={`card flex flex-col ${isCurrent ? "ring-2 ring-brand-500" : ""}`}>
              <p className="font-display font-bold text-lg">{p.name}</p>
              <p className="text-xs text-slate-500 mb-4">
                {p.name === "Starter" ? "Best for small landlords" : p.name === "Standard" ? "Most popular for growing properties" : "For large portfolios"}
              </p>
              <p className="text-4xl font-display font-extrabold text-ink mb-1">
                ₹{p.price_per_month}<span className="text-sm font-normal text-slate-400">/month</span>
              </p>
              <ul className="space-y-2 my-5 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button
                disabled={isCurrent || switching === p.id}
                onClick={() => changePlan(p.id)}
                className={isCurrent ? "btn-secondary w-full" : "btn-primary w-full"}
              >
                {isCurrent ? "Current plan" : switching === p.id ? "Switching..." : "Switch to this plan"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
