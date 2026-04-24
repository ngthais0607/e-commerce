import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Send, X, Paperclip, Bot, Headphones } from 'lucide-react';
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
  const { isAuthenticated, token, user } = useAuthStore();

  if (user?.role === 'ADMIN' || user?.role === 'STAFF') return null;

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const liveMessagesEndRef = useRef<HTMLDivElement>(null);

  const faqQuickReplies = useMemo(
    () => ['Return policy', 'Shipping fee', 'Payment methods', 'Track my order'],
    []
  );

  const scrollToBottom = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (tab === 'quick') scrollToBottom(messagesEndRef);
  }, [messages, tab]);

  useEffect(() => {
    if (tab === 'live') scrollToBottom(liveMessagesEndRef);
  }, [liveMessages, tab]);

  const pushMessage = (msg: BotMessage) =>
    setMessages((prev) => [...prev, { ...msg, time: msg.time ?? new Date() }]);

  const handleSend = async (text?: string) => {
    const content = text ?? input;
    if (!content.trim()) return;
    const question = content.trim();
    setInput('');
    pushMessage({ from: 'user', text: question, time: new Date() });

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
        const faqText =
          faqs.length > 0
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
    if (!isAuthenticated) {
      setMessages([{ from: 'bot', text: 'Hello! How can I help you today?', time: new Date() }]);
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
      await api.post(`/support/conversations/${liveConversation.id}/messages`, { message: text });
      // socket 'support-message' event will add the message to liveMessages
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to send message.';
      setLiveMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          conversationId: liveConversation.id,
          senderRole: 'CUSTOMER',
          message: `Failed: ${errMsg}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const statusColor =
    liveConversation?.status === 'ASSIGNED'
      ? 'bg-emerald-400'
      : liveConversation?.status === 'OPEN'
      ? 'bg-amber-400'
      : 'bg-slate-400';

  const statusLabel =
    liveConversation?.status === 'ASSIGNED'
      ? 'Assigned'
      : liveConversation?.status === 'OPEN'
      ? 'Waiting...'
      : liveConversation?.status === 'CLOSED'
      ? 'Closed'
      : 'Always online';

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="w-[340px] sm:w-[420px] h-[500px] bg-background shadow-2xl border border-border rounded-2xl overflow-hidden flex flex-col mb-3">
          <div className="flex flex-1 min-h-0">
            {/* Sidebar */}
            <aside className="w-[88px] shrink-0 bg-slate-50 dark:bg-slate-900 border-r border-border flex flex-col">
              <div className="px-3 pt-3 pb-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Chat</p>
              </div>
              <nav className="flex flex-col gap-1 px-2 pb-2">
                {/* Bot tab */}
                <button
                  className={`group flex flex-col items-center gap-1.5 px-1 py-3 rounded-xl text-center transition-all duration-200 ${
                    tab === 'quick'
                      ? 'bg-sky-500 shadow-md shadow-sky-200 dark:shadow-sky-900 text-white'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                  onClick={() => setTab('quick')}
                >
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                      tab === 'quick'
                        ? 'bg-white/20'
                        : 'bg-slate-200 dark:bg-slate-700 group-hover:bg-slate-300 dark:group-hover:bg-slate-600'
                    }`}
                  >
                    <Bot className={`h-4 w-4 ${tab === 'quick' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  </span>
                  <span className="text-[11px] font-medium leading-tight">Quick help</span>
                </button>

                {/* Live tab */}
                <button
                  className={`group flex flex-col items-center gap-1.5 px-1 py-3 rounded-xl text-center transition-all duration-200 ${
                    tab === 'live'
                      ? 'bg-sky-500 shadow-md shadow-sky-200 dark:shadow-sky-900 text-white'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                  onClick={() => {
                    setTab('live');
                    if (!liveConversation && !connecting) startLiveChat();
                  }}
                >
                  <span
                    className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                      tab === 'live'
                        ? 'bg-white/20'
                        : 'bg-slate-200 dark:bg-slate-700 group-hover:bg-slate-300 dark:group-hover:bg-slate-600'
                    }`}
                  >
                    <Headphones className={`h-4 w-4 ${tab === 'live' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                    {/* Online dot */}
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-800" />
                  </span>
                  <span className="text-[11px] font-medium leading-tight">Live chat</span>
                </button>
              </nav>
            </aside>

            {/* Main chat area */}
            <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-background">
              {/* Header */}
              <header className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-semibold text-xs">
                      {tab === 'quick' ? 'AI' : 'CS'}
                    </div>
                    {tab === 'live' && (
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-background ${statusColor}`} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate leading-tight">
                      {tab === 'live' && liveConversation
                        ? `Live support #${liveConversation.id}`
                        : tab === 'live'
                        ? 'Live chat'
                        : 'Support Bot'}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-tight">{statusLabel}</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
                {tab === 'quick' && (
                  <>
                    {messages.map((m, idx) => (
                      <div key={idx} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl whitespace-pre-wrap shadow-sm ${
                            m.from === 'user'
                              ? 'bg-sky-500 text-white rounded-br-sm'
                              : 'bg-white dark:bg-slate-800 text-foreground rounded-bl-sm border border-border'
                          }`}
                        >
                          <p className="text-[13px] leading-relaxed">{m.text}</p>
                          {m.time && (
                            <p className={`text-[10px] mt-1 ${m.from === 'user' ? 'text-sky-100' : 'text-muted-foreground'}`}>
                              {formatMessageTime(m.time)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white dark:bg-slate-800 border border-border shadow-sm flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}

                {tab === 'live' && (
                  <>
                    {!isAuthenticated && (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted-foreground text-center px-4">Please sign in to chat with our staff.</p>
                      </div>
                    )}
                    {connecting && (
                      <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                        <span>Connecting...</span>
                      </div>
                    )}
                    {liveLoading && (
                      <p className="text-sm text-muted-foreground py-2 text-center">Loading messages...</p>
                    )}
                    {liveConversation && !liveLoading && liveMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-6">
                        <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                          <Headphones className="h-5 w-5 text-sky-500" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Connected to support</p>
                        <p className="text-xs text-muted-foreground">Start typing to reach our staff.</p>
                      </div>
                    )}
                    {liveMessages.map((m) => (
                      <div key={m.id} className={`flex flex-col gap-0.5 ${m.senderRole === 'CUSTOMER' ? 'items-end' : 'items-start'}`}>
                        {m.senderRole !== 'CUSTOMER' && (
                          <span className="text-[10px] text-muted-foreground px-1 font-medium">
                            {m.senderRole === 'ADMIN' ? 'Admin' : 'Staff'}
                          </span>
                        )}
                        <div
                          className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl whitespace-pre-wrap shadow-sm ${
                            m.senderRole === 'CUSTOMER'
                              ? 'bg-sky-500 text-white rounded-br-sm'
                              : 'bg-white dark:bg-slate-800 text-foreground rounded-bl-sm border border-border'
                          }`}
                        >
                          <p className="text-[13px] leading-relaxed">{m.message}</p>
                          <p className={`text-[10px] mt-1 ${m.senderRole === 'CUSTOMER' ? 'text-sky-100' : 'text-muted-foreground'}`}>
                            {formatMessageTime(new Date(m.createdAt))}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={liveMessagesEndRef} />
                  </>
                )}
              </div>

              {/* Input area */}
              {tab === 'quick' && (
                <div className="p-3 border-t border-border bg-background shrink-0 space-y-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    {faqQuickReplies.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleQuickReply(q)}
                        disabled={loading}
                        className={`text-[11px] px-2 py-1.5 rounded-lg text-center font-medium transition-all duration-150 select-none border ${
                          pressedQuick === q
                            ? 'scale-95 bg-sky-500 text-white border-sky-500'
                            : 'bg-background hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border-border hover:border-sky-300'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button type="button" className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors" aria-label="Attach file">
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); handleSend(); }
                      }}
                      placeholder="Type a message..."
                      className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-input bg-slate-50 dark:bg-slate-900 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all"
                    />
                    <button
                      onClick={() => handleSend()}
                      className="p-2 rounded-xl bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-40 transition-colors"
                      disabled={loading || !input.trim()}
                      aria-label="Send"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {tab === 'live' && (
                <div className="p-3 border-t border-border bg-background shrink-0">
                  <div className="flex items-center gap-1.5">
                    <button type="button" className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors" aria-label="Attach file">
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <input
                      value={liveInput}
                      onChange={(e) => setLiveInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); sendLiveMessage(); }
                      }}
                      placeholder={isAuthenticated ? 'Type a message...' : 'Sign in to chat'}
                      className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-input bg-slate-50 dark:bg-slate-900 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all disabled:opacity-50"
                      disabled={!isAuthenticated || connecting || !liveConversation}
                    />
                    <button
                      onClick={() => sendLiveMessage()}
                      className="p-2 rounded-xl bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-40 transition-colors"
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

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-3 rounded-full shadow-lg bg-gradient-to-r from-sky-500 to-cyan-400 text-white hover:shadow-xl hover:scale-105 active:scale-100 transition-all duration-200 shadow-sky-400/40"
        aria-label={open ? 'Close chat' : 'Open support chat'}
      >
        <MessageSquare className="h-4 w-4" />
        <span className="text-sm font-medium">{open ? 'Close' : 'Support'}</span>
      </button>
    </div>
  );
}
