import { useEffect, useState } from "react";
import api from "../../api/client";
import { PageHeader, StatusPill, Spinner, EmptyState } from "../../components/ui";
import { Home } from "lucide-react";

export default function MyRoom() {
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get("/tenant/my-room").then((r) => setData(r.data)).catch(() => setNotFound(true));
  }, []);

  if (notFound) return <div className="card"><EmptyState icon={Home} title="No room currently assigned" /></div>;
  if (!data) return <Spinner />;

  return (
    <div>
      <PageHeader title="My Room" subtitle="Details of your current unit and charges" />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold">Property & unit</h3><StatusPill status={data.status} />
          </div>
          <Row label="Property name" v={data.property_name} />
          <Row label="Location" v={data.location} />
          <Row label="Property type" v={data.property_type} />
          <Row label="Unit number" v={data.unit_number} />
          <Row label="Unit type" v={data.unit_type} />
          <Row label="Floor" v={data.floor} />
          <Row label="Occupied since" v={data.occupied_since} />
        </div>
        <div className="card">
          <h3 className="font-display font-bold mb-4">Rent & charges</h3>
          <Row label="Monthly rent" v={`₹${data.monthly_rent.toLocaleString("en-IN")}`} />
          <Row label="Advance" v={`₹${data.advance.toLocaleString("en-IN")}`} />
          <Row label="Electricity" v={`₹${data.electricity}`} />
          <Row label="Water" v={`₹${data.water}`} />
          <Row label="Maintenance" v={`₹${data.maintenance}`} />
          <h4 className="font-display font-bold mt-6 mb-3 text-sm">BHK details</h4>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(data.bhk).map(([k, v]) => (
              <div key={k} className="rounded-lg bg-slate-50 text-center py-2.5">
                <p className="text-[10px] text-slate-400 font-semibold">{k} BHK</p>
                <p className="font-mono font-bold text-sm">₹{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, v }) {
  return (
    <div className="flex justify-between py-1.5 text-sm border-b border-slate-50 last:border-0">
      <span className="text-slate-400">{label}</span><span className="font-medium text-ink">{v || "—"}</span>
    </div>
  );
}
