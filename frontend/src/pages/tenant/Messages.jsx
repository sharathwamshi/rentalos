import { useEffect, useState, useRef } from "react";
import { Send, MessageSquare, Plus } from "lucide-react";
import api from "../../api/client";
import { EmptyState, Modal, Spinner } from "../../components/ui";

export default function TenantMessages() {
  const [threads, setThreads] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({ subject: "", body: "" });
  const bottomRef = useRef();

  const loadThreads = () => api.get("/tenant/messages").then((r) => { setThreads(r.data); if (r.data[0] && !activeId) setActiveId(r.data[0].id); });
  useEffect(() => { loadThreads(); }, []);
  useEffect(() => { if (activeId) api.get(`/tenant/messages/${activeId}`).then((r) => setMessages(r.data)); }, [activeId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    await api.post(`/tenant/messages/${activeId}/reply`, { body });
    setBody("");
    const r = await api.get(`/tenant/messages/${activeId}`);
    setMessages(r.data);
  };

  const startNew = async (e) => {
    e.preventDefault();
    const { data } = await api.post("/tenant/messages/new", newForm);
    setNewOpen(false);
    setNewForm({ subject: "", body: "" });
    await loadThreads();
    setActiveId(data.thread_id);
  };

  if (!threads) return <Spinner />;

  return (
    <div className="card !p-0 flex h-[calc(100vh-140px)] overflow-hidden">
      <div className="w-72 border-r border-slate-100 overflow-y-auto shrink-0 flex flex-col">
        <div className="p-3 border-b border-slate-100">
          <button className="btn-primary !bg-tenant-gradient w-full !py-2 text-xs" onClick={() => setNewOpen(true)}><Plus size={14} /> New message</button>
        </div>
        {threads.length === 0 ? <p className="text-sm text-slate-400 p-4">No conversations yet.</p> : threads.map((t) => (
          <button key={t.id} onClick={() => setActiveId(t.id)} className={`w-full text-left px-4 py-3 border-b border-slate-50 ${activeId === t.id ? "bg-cyan-50" : "hover:bg-slate-50"}`}>
            <p className="text-sm font-semibold text-ink">{t.subject}</p>
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col">
        {!activeId ? <EmptyState icon={MessageSquare} title="No conversation selected" /> : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className="max-w-[70%] rounded-xl px-3.5 py-2 text-sm bg-cyan-50">
                  {m.body}<p className="text-[10px] text-slate-400 mt-1">{new Date(m.created_at).toLocaleString()}</p>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={send} className="p-3 border-t border-slate-100 flex gap-2">
              <input className="input flex-1" placeholder="Type a message..." value={body} onChange={(e) => setBody(e.target.value)} />
              <button className="btn-primary !bg-tenant-gradient !px-3"><Send size={16} /></button>
            </form>
          </>
        )}
      </div>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="New message to your owner">
        <form onSubmit={startNew} className="space-y-4">
          <div><label className="label">Subject</label><input className="input" required value={newForm.subject} onChange={(e) => setNewForm({ ...newForm, subject: e.target.value })} /></div>
          <div><label className="label">Message</label><textarea className="input" rows={4} required value={newForm.body} onChange={(e) => setNewForm({ ...newForm, body: e.target.value })} /></div>
          <button className="btn-primary w-full !bg-tenant-gradient">Send message</button>
        </form>
      </Modal>
    </div>
  );
}
