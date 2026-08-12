import { useEffect, useState } from "react";
import { Plus, Home, Zap, Droplet, Wrench as WrenchIcon, Trash2 } from "lucide-react";
import api from "../../api/client";
import { PageHeader, Modal, EmptyState, StatusPill, Spinner } from "../../components/ui";

const AMENITY_FIELDS = ["fan", "light", "chimney", "geyser", "ups_battery"];

function emptyRoom() {
  return {
    unit_number: "", rent_type: "Rent", unit_type: "", floor: "", monthly_rent: 0, advance_amount: 0,
    electricity_charge: 0, water_charge: 0, maintenance_charge: 0, bhk: { 1: 0, 2: 0, 3: 0, 4: 0 },
    amenities: {}, status: "vacant", notes: "",
  };
}

export default function Properties() {
  const [properties, setProperties] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", property_type: "Residential", location: "", rooms: [emptyRoom()] });

  const load = () => api.get("/owner/properties").then((r) => setProperties(r.data));
  useEffect(() => { load(); }, []);

  const updateRoom = (idx, field, value) => {
    const rooms = [...form.rooms];
    rooms[idx] = { ...rooms[idx], [field]: value };
    setForm({ ...form, rooms });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/owner/properties", form);
      setOpen(false);
      setForm({ name: "", property_type: "Residential", location: "", rooms: [emptyRoom()] });
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Could not save property.");
    } finally {
      setSaving(false);
    }
  };

  if (!properties) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Property"
        subtitle="Add and manage your properties and rooms"
        action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add property</button>}
      />

      {properties.length === 0 ? (
        <div className="card">
          <EmptyState icon={Home} title="No properties yet" subtitle="Add your first property to start assigning tenants and tracking rent." />
        </div>
      ) : (
        <div className="space-y-6">
          {properties.map((p) => (
            <div key={p.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-ink">{p.name}</h3>
                  <p className="text-xs text-slate-500">{p.property_type} · {p.location}</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {p.rooms.map((r) => (
                  <div key={r.id} className="rounded-xl border border-slate-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm">Unit {r.unit_number}</p>
                      <StatusPill status={r.status} />
                    </div>
                    <p className="text-lg font-display font-bold text-ink">₹{r.monthly_rent.toLocaleString("en-IN")}<span className="text-xs font-normal text-slate-400">/mo</span></p>
                    <div className="flex gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Zap size={12} /> ₹{r.electricity_charge}</span>
                      <span className="flex items-center gap-1"><Droplet size={12} /> ₹{r.water_charge}</span>
                      <span className="flex items-center gap-1"><WrenchIcon size={12} /> ₹{r.maintenance_charge}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add property" wide>
        <form onSubmit={submit} className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Property type</label>
              <select className="input" value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })}>
                <option>Residential</option><option>Commercial</option>
              </select>
            </div>
            <div>
              <label className="label">Property name</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>

          {form.rooms.map((room, idx) => (
            <div key={idx} className="rounded-xl border border-slate-100 p-4 bg-slate-50/50">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-sm">Room details #{idx + 1}</p>
                {form.rooms.length > 1 && (
                  <button type="button" onClick={() => setForm({ ...form, rooms: form.rooms.filter((_, i) => i !== idx) })} className="text-rose-500">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><label className="label">Unit number</label><input className="input" required placeholder="e.g. A-101" value={room.unit_number} onChange={(e) => updateRoom(idx, "unit_number", e.target.value)} /></div>
                <div><label className="label">Unit type</label><input className="input" value={room.unit_type} onChange={(e) => updateRoom(idx, "unit_type", e.target.value)} /></div>
                <div><label className="label">Floor</label><input className="input" value={room.floor} onChange={(e) => updateRoom(idx, "floor", e.target.value)} /></div>
                <div><label className="label">Monthly rent</label><input type="number" className="input" value={room.monthly_rent} onChange={(e) => updateRoom(idx, "monthly_rent", +e.target.value)} /></div>
                <div><label className="label">Advance amount</label><input type="number" className="input" value={room.advance_amount} onChange={(e) => updateRoom(idx, "advance_amount", +e.target.value)} /></div>
                <div><label className="label">Electricity charge</label><input type="number" className="input" value={room.electricity_charge} onChange={(e) => updateRoom(idx, "electricity_charge", +e.target.value)} /></div>
                <div><label className="label">Water charge</label><input type="number" className="input" value={room.water_charge} onChange={(e) => updateRoom(idx, "water_charge", +e.target.value)} /></div>
                <div><label className="label">Maintenance charge</label><input type="number" className="input" value={room.maintenance_charge} onChange={(e) => updateRoom(idx, "maintenance_charge", +e.target.value)} /></div>
              </div>
              <div className="mt-3">
                <label className="label">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {AMENITY_FIELDS.map((a) => (
                    <label key={a} className="flex items-center gap-1.5 text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer">
                      <input type="checkbox" checked={!!room.amenities[a]} onChange={(e) => updateRoom(idx, "amenities", { ...room.amenities, [a]: e.target.checked })} />
                      {a.replace("_", " ")}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <button type="button" className="btn-secondary" onClick={() => setForm({ ...form, rooms: [...form.rooms, emptyRoom()] })}>
            <Plus size={16} /> Add another room
          </button>

          <div className="flex gap-3 pt-2">
            <button className="btn-primary flex-1" disabled={saving}>{saving ? "Saving..." : "Save property"}</button>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
