import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function MessageThread({ applicationId, otherPartyLabel }) {
  const { user } = useAuth();
  const notify = useToast();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  async function loadMessages() {
    setLoading(true);
    try {
      const res = await api.get(`/applications/${applicationId}/messages`);
      setMessages(res.data.messages);
    } catch {
      notify("Couldn't load messages.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/applications/${applicationId}/messages`, { body });
      setMessages((prev) => [...prev, res.data.message]);
      setBody("");
    } catch (err) {
      notify(err.response?.data?.message || "Couldn't send that message.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 px-3 py-2"
      >
        <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
        {open ? "Hide messages" : `Message ${otherPartyLabel || ""}`}
      </button>

      {open && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-3">
          <div className="max-h-56 overflow-y-auto space-y-2 mb-2" aria-live="polite">
            {loading && <div className="text-xs text-slate-400 text-center py-3">Loading…</div>}
            {!loading && messages.length === 0 && (
              <div className="text-xs text-slate-400 text-center py-3">No messages yet — say hello.</div>
            )}
            {messages.map((m) => {
              const isMine = m.sender === user.id || m.sender?._id === user.id;
              return (
                <div key={m._id} className={"flex " + (isMine ? "justify-end" : "justify-start")}>
                  <div
                    className={
                      "max-w-[75%] text-xs px-3 py-2 rounded-lg " +
                      (isMine
                        ? "bg-teal-600 text-white rounded-br-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-sm")
                    }
                  >
                    {m.body}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={sendMessage} className="flex gap-2">
            <label htmlFor={`msg-${applicationId}`} className="sr-only">Write a message</label>
            <input
              id={`msg-${applicationId}`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a message…"
              className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              disabled={sending || !body.trim()}
              type="submit"
              aria-label="Send message"
              className="bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-lg px-3 flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
