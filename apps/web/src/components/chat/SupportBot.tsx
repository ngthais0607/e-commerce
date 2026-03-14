import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send, X, Paperclip, Image as ImageIcon } from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/lib/socket';

const formatMessageTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

type BotMessage = {
  from: 'bot' | 'user';
  text: string;
  time?: Date;
};

type OrderQuickAnswer = {
  type: 'order_status';
  order: {
    id: number;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    trackingCode?: string | null;
    total: number;
    createdAt: string;
  };
  message: string;
};

type FAQAnswer = {
  type: 'faq';
  faqs: { q: string; a: string }[];
};

type SupportConversation = {
  id: number;
  status: 'OPEN' | 'ASSIGNED' | 'CLOSED';
  assignedStaffId: number | null;
};

type SupportChatMessage = {
  id: number;
  conversationId: number;
  senderRole: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  message: string;
  createdAt: string;
};

export default function SupportBot() {
  const { isAuthenticated, token } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'quick' | 'live'>('quick');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<BotMessage[]>([
    { from: 'bot', text: 'Hello! How can I help you today?', time: new Date() },
  ]);
  const [loading, setLoading] = useState(false);
  const [liveConversation, setLiveConversation] = useState<SupportConversation | null>(null);
  const [liveMessages, setLiveMessages] = useState<SupportChatMessage[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveInput, setLiveInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [, setSocketReady] = useState(false);
  const [pressedQuick, setPressedQuick] = useState<string | null>(null);

  const faqQuickReplies = useMemo(
    () => [
      'Return policy',
      'Shipping fee',
      'Payment methods',
      'Track my order',
    ],
    []
  );

  const pushMessage = (msg: BotMessage) => setMessages((prev) => [...prev, { ...msg, time: msg.time ?? new Date() }]);

  const handleSend = async (text?: string) => {
    const content = text ?? input;
    if (!content.trim()) return;
    const question = content.trim();
    setInput('');
    pushMessage({ from: 'user', text: question, time: new Date() });

    // Nếu câu chứa số, thử coi như orderId; không thì gửi question để API trả đúng 1 FAQ
    const maybeOrderId = Number(question.replace(/\D/g, ''));
    const body = maybeOrderId ? { orderId: maybeOrderId } : { question };
    setLoading(true);
    try {
      const res = await api.post('/support/quick-answer', body);
      const data = res.data as OrderQuickAnswer | (FAQAnswer & { message?: string });
      if (data.type === 'order_status') {
        pushMessage({ from: 'bot', text: data.message });
      } else if (data.type === 'faq') {
        const faqs = data.faqs ?? [];
        const faqText = faqs.length > 0
          ? faqs.map((f) => `• ${f.q}: ${f.a}`).join('\n')
          : (data.message ?? 'I have received your request.');
        pushMessage({ from: 'bot', text: faqText });
      } else {
        pushMessage({ from: 'bot', text: 'I have received your request.' });
      }
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Sorry, I cannot answer that right now.';
      pushMessage({ from: 'bot', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReply = (text: string) => {
    setPressedQuick(text);
    setTimeout(() => setPressedQuick(null), 400);
    handleSend(text);
  };

  useEffect(() => {
    // reset when logged out
    if (!isAuthenticated) {
      setMessages([
        { from: 'bot', text: 'Hello! How can I help you today?', time: new Date() },
      ]);
      setLiveConversation(null);
      setLiveMessages([]);
      setLiveInput('');
      setSocketReady(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!liveConversation || !token) return;
    const socket = getSocket(token);
    if (!socket) return;
    socket.emit('join-support-conv', liveConversation.id);
    setSocketReady(true);

    const handleMessage = (payload: { conversationId: number; message: SupportChatMessage }) => {
      if (payload.conversationId === liveConversation.id) {
        setLiveMessages((prev) => [...prev, payload.message]);
      }
    };
    socket.on('support-message', handleMessage);

    return () => {
      socket.emit('leave-support-conv', liveConversation.id);
      socket.off('support-message', handleMessage);
    };
  }, [liveConversation, token]);

  const loadConversationMessages = async (conversationId: number) => {
    setLiveLoading(true);
    try {
      const res = await api.get(`/support/conversations/${conversationId}/messages`);
      setLiveMessages(res.data.messages || []);
    } finally {
      setLiveLoading(false);
    }
  };

  const startLiveChat = async () => {
    if (!isAuthenticated) {
      pushMessage({ from: 'bot', text: 'Please sign in to chat with our staff.' });
      setTab('quick');
      return;
    }
    setConnecting(true);
    try {
      const res = await api.post('/support/conversations');
      setLiveConversation(res.data);
      await loadConversationMessages(res.data.id);
      setTab('live');
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Unable to start live chat right now.';
      pushMessage({ from: 'bot', text: errMsg });
      setTab('quick');
    } finally {
      setConnecting(false);
    }
  };

  const sendLiveMessage = async () => {
    if (!liveConversation || !liveInput.trim()) return;
    const text = liveInput.trim();
    setLiveInput('');
    try {
      const res = await api.post(`/support/conversations/${liveConversation.id}/messages`, { message: text });
      setLiveMessages((prev) => [...prev, res.data]);
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to send message.';
      setLiveMessages((prev) => [
        ...prev,
        { id: Date.now(), conversationId: liveConversation.id, senderRole: 'CUSTOMER', message: `Failed: ${errMsg}`, createdAt: new Date().toISOString() },
      ]);
    }
  };

  const chatTitle = tab === 'live' ? (liveConversation ? `Live support #${liveConversation.id}` : 'Live chat') : 'Support Bot';
  const chatStatus = tab === 'live' && liveConversation ? liveConversation.status.toLowerCase() : 'Always online';

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="w-[320px] sm:w-[400px] h-[480px] bg-background shadow-2xl border border-border rounded-2xl overflow-hidden flex flex-col">
          {/* Two-panel layout: sidebar ~30%, chat ~70% */}
          <div className="flex flex-1 min-h-0">
            {/* Left: Mode list - compact */}
            <aside className="w-24 sm:w-28 shrink-0 border-r border-border bg-muted/20 flex flex-col">
              <div className="p-2 border-b border-border">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Chat</h3>
              </div>
              <nav className="p-1.5 space-y-1 overflow-y-auto">
                <button
                  className={`w-full flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-center text-xs transition-colors ${
                    tab === 'quick'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-muted text-foreground'
                  }`}
                  onClick={() => setTab('quick')}
                >
                  <span className="w-9 h-9 rounded-full bg-background/80 flex items-center justify-center text-[10px] font-semibold shrink-0">
                    Bot
                  </span>
                  <span className="leading-tight">Quick help</span>
                </button>
                <button
                  className={`w-full flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-center text-xs transition-colors ${
                    tab === 'live'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-muted text-foreground'
                  }`}
                  onClick={() => {
                    setTab('live');
                    if (!liveConversation && !connecting) startLiveChat();
                  }}
                >
                  <span className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-semibold shrink-0 text-emerald-700 dark:text-emerald-400">
                    Live
                  </span>
                  <span className="leading-tight">Live chat</span>
                </button>
              </nav>
            </aside>

            {/* Right: Chat area */}
            <main className="flex-1 flex flex-col min-w-0">
              {/* Chat header */}
              <header className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-background shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-xs shrink-0">
                    {tab === 'quick' ? 'AI' : 'CS'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{chatTitle}</p>
                    <p className="text-[11px] text-muted-foreground capitalize">{chatStatus}</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                  aria-label="Close chat"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </header>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {tab === 'quick' && (
                  <>
                    {messages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[88%] px-3.5 py-2 rounded-2xl whitespace-pre-wrap ${
                            m.from === 'user'
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted text-foreground rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm leading-snug">{m.text}</p>
                          {m.time && (
                            <p className={`text-[11px] mt-1 ${m.from === 'user' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                              {formatMessageTime(m.time)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="px-4 py-2 rounded-2xl rounded-bl-md bg-muted text-muted-foreground text-sm">
                          Processing...
                        </div>
                      </div>
                    )}
                  </>
                )}

                {tab === 'live' && (
                  <>
                    {!isAuthenticated && (
                      <div className="text-sm text-muted-foreground py-2">Please sign in to chat with our staff.</div>
                    )}
                    {connecting && (
                      <div className="text-sm text-muted-foreground py-2">Connecting to staff...</div>
                    )}
                    {liveConversation && !liveLoading && liveMessages.length === 0 && (
                      <div className="text-sm text-muted-foreground py-2">No messages yet. Start typing to reach our staff.</div>
                    )}
                    {liveLoading && (
                      <div className="text-sm text-muted-foreground py-2">Loading messages...</div>
                    )}
                    {liveMessages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.senderRole === 'CUSTOMER' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] px-4 py-2.5 rounded-2xl whitespace-pre-wrap ${
                            m.senderRole === 'CUSTOMER'
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted text-foreground rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm">{m.message}</p>
                          <p className={`text-[11px] mt-1 ${m.senderRole === 'CUSTOMER' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                            {formatMessageTime(new Date(m.createdAt))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Input area */}
              {tab === 'quick' && (
                <div className="p-2.5 border-t border-border bg-background shrink-0 space-y-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    {faqQuickReplies.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleQuickReply(q)}
                        disabled={loading}
                        className={`text-xs px-2 py-1.5 rounded-xl text-center font-medium transition-all duration-200 ease-out select-none
                          ${pressedQuick === q
                            ? 'scale-95 bg-primary text-primary-foreground ring-2 ring-primary/50'
                            : 'bg-muted hover:bg-muted/80 hover:scale-[1.02] active:scale-[0.98] text-foreground shadow-sm'
                          }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button type="button" className="p-2 rounded-lg text-muted-foreground hover:bg-muted" aria-label="Attach file">
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button type="button" className="p-2 rounded-lg text-muted-foreground hover:bg-muted" aria-label="Image">
                      <ImageIcon className="h-4 w-4" />
                    </button>
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Type a message..."
                      className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      onClick={() => handleSend()}
                      className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      disabled={loading}
                      aria-label="Send"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Order ID → status. Live tab for staff.</p>
                </div>
              )}

              {tab === 'live' && (
                <div className="p-3 border-t border-border bg-background shrink-0">
                  <div className="flex items-center gap-2">
                    <button type="button" className="p-2 rounded-lg text-muted-foreground hover:bg-muted" aria-label="Attach file">
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <input
                      value={liveInput}
                      onChange={(e) => setLiveInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          sendLiveMessage();
                        }
                      }}
                      placeholder={isAuthenticated ? 'Type a message...' : 'Sign in to chat'}
                      className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                      disabled={!isAuthenticated || connecting || !liveConversation}
                    />
                    <button
                      onClick={() => sendLiveMessage()}
                      className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      disabled={!isAuthenticated || connecting || !liveConversation || !liveInput.trim()}
                      aria-label="Send"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-3 rounded-full shadow-lg bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-400 text-white hover:bg-sky-600 hover:shadow-xl hover:scale-105 active:scale-100 transition-all duration-200 shadow-sky-400/40 hover:shadow-sky-400/60"
        aria-label={open ? 'Close chat' : 'Open support chat'}
      >
        <MessageSquare className="h-4 w-4" />
        <span className="font-medium">{open ? 'Close' : 'Support'}</span>
      </button>
    </div>
  );
}


