import { useEffect, useState, useRef } from "react";
import { Send, MessageSquare } from "lucide-react";
import api from "../../api/client";
import { EmptyState, Spinner } from "../../components/ui";

export default function Messages() {
  const [threads, setThreads] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const bottomRef = useRef();

  const loadThreads = () => api.get("/owner/messages").then((r) => { setThreads(r.data); if (r.data[0] && !activeId) setActiveId(r.data[0].id); });
  useEffect(() => { loadThreads(); }, []);

  useEffect(() => {
    if (activeId) api.get(`/owner/messages/${activeId}`).then((r) => setMessages(r.data));
  }, [activeId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    await api.post(`/owner/messages/${activeId}`, { body });
    setBody("");
    const r = await api.get(`/owner/messages/${activeId}`);
    setMessages(r.data);
  };

  if (!threads) return <Spinner />;

  return (
    <div className="card !p-0 flex h-[calc(100vh-140px)] overflow-hidden">
      <div className="w-72 border-r border-slate-100 overflow-y-auto shrink-0">
        {threads.length === 0 ? (
          <p className="text-sm text-slate-400 p-4">No conversations yet.</p>
        ) : threads.map((t) => (
          <button key={t.id} onClick={() => setActiveId(t.id)}
            className={`w-full text-left px-4 py-3 border-b border-slate-50 ${activeId === t.id ? "bg-brand-50" : "hover:bg-slate-50"}`}>
            <p className="text-sm font-semibold text-ink">{t.tenant_name}</p>
            <p className="text-xs text-slate-400 truncate">{t.subject}</p>
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col">
        {!activeId ? (
          <EmptyState icon={MessageSquare} title="No conversation selected" />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className="max-w-[70%] rounded-xl px-3.5 py-2 text-sm bg-slate-100">
                  {m.body}
                  <p className="text-[10px] text-slate-400 mt-1">{new Date(m.created_at).toLocaleString()}</p>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={send} className="p-3 border-t border-slate-100 flex gap-2">
              <input className="input flex-1" placeholder="Type a reply..." value={body} onChange={(e) => setBody(e.target.value)} />
              <button className="btn-primary !px-3"><Send size={16} /></button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
