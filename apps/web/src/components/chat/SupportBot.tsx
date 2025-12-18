import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/lib/socket';

type BotMessage = {
  from: 'bot' | 'user';
  text: string;
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
    { from: 'bot', text: 'Hi there! How can I help you today? You can ask about your order status or see quick FAQs.' },
  ]);
  const [loading, setLoading] = useState(false);
  const [liveConversation, setLiveConversation] = useState<SupportConversation | null>(null);
  const [liveMessages, setLiveMessages] = useState<SupportChatMessage[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveInput, setLiveInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [, setSocketReady] = useState(false);

  const faqQuickReplies = useMemo(
    () => [
      'Return policy',
      'Shipping fee',
      'Payment methods',
      'Track my order',
    ],
    []
  );

  const pushMessage = (msg: BotMessage) => setMessages((prev) => [...prev, msg]);

  const handleSend = async (text?: string) => {
    const content = text ?? input;
    if (!content.trim()) return;
    const question = content.trim();
    setInput('');
    pushMessage({ from: 'user', text: question });

    // Nếu câu chứa số, thử coi như orderId
    const maybeOrderId = Number(question.replace(/\D/g, ''));
    setLoading(true);
    try {
      const res = await api.post('/support/quick-answer', maybeOrderId ? { orderId: maybeOrderId } : {});
      const data = res.data as OrderQuickAnswer | FAQAnswer;
      if (data.type === 'order_status') {
        pushMessage({ from: 'bot', text: data.message });
      } else if (data.type === 'faq') {
        const faqText = data.faqs
          .map((f) => `• ${f.q}: ${f.a}`)
          .join('\n');
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
    setInput(text);
    handleSend(text);
  };

  useEffect(() => {
    // reset when logged out
    if (!isAuthenticated) {
      setMessages([
        { from: 'bot', text: 'Hi there! How can I help you today? You can ask about your order status or see quick FAQs.' },
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

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="w-80 sm:w-96 bg-white shadow-xl border border-border rounded-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white">
            <div className="font-semibold">Support Bot</div>
            <button onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-3 pt-3 flex gap-2 text-xs">
            <button
              className={`px-3 py-1 rounded-full ${tab === 'quick' ? 'bg-primary text-white' : 'bg-muted'}`}
              onClick={() => setTab('quick')}
            >
              Quick help
            </button>
            <button
              className={`px-3 py-1 rounded-full ${tab === 'live' ? 'bg-primary text-white' : 'bg-muted'}`}
              onClick={() => {
                setTab('live');
                if (!liveConversation && !connecting) startLiveChat();
              }}
            >
              Live chat
            </button>
          </div>

          {tab === 'quick' && (
            <>
              <div className="p-3 h-60 overflow-y-auto space-y-2 text-sm">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg whitespace-pre-wrap ${
                        m.from === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="text-xs text-muted-foreground">Processing...</div>
                )}
              </div>
              <div className="px-3 pb-3">
                <div className="flex flex-wrap gap-2 mb-2">
                  {faqQuickReplies.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleQuickReply(q)}
                      className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type a question or order ID..."
                    className="flex-1 px-3 py-2 border rounded-md text-sm"
                  />
                  <button
                    onClick={() => handleSend()}
                    className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={loading}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  You can type your order ID (e.g. 123) to check its status. For detailed support, switch to Live chat with staff.
                </div>
              </div>
            </>
          )}

          {tab === 'live' && (
            <>
              <div className="p-3 h-60 overflow-y-auto space-y-2 text-sm">
                {!isAuthenticated && (
                  <div className="text-xs text-muted-foreground">
                    Please sign in to chat with our staff.
                  </div>
                )}
                {connecting && <div className="text-xs text-muted-foreground">Connecting to staff...</div>}
                {liveConversation && (
                  <div className="text-[11px] text-muted-foreground">
                    Conversation #{liveConversation.id} · Status: {liveConversation.status.toLowerCase()}
                  </div>
                )}
                {liveLoading ? (
                  <div className="text-xs text-muted-foreground">Loading messages...</div>
                ) : liveMessages.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No messages yet. Start typing to reach our staff.</div>
                ) : (
                  liveMessages.map((m) => (
                    <div key={m.id} className={`flex ${m.senderRole === 'CUSTOMER' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-lg whitespace-pre-wrap ${
                          m.senderRole === 'CUSTOMER'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        {m.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-3 pb-3">
                <div className="flex items-center gap-2">
                  <input
                    value={liveInput}
                    onChange={(e) => setLiveInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        sendLiveMessage();
                      }
                    }}
                    placeholder={isAuthenticated ? 'Chat with staff...' : 'Sign in to chat'}
                    className="flex-1 px-3 py-2 border rounded-md text-sm"
                    disabled={!isAuthenticated || connecting || !liveConversation}
                  />
                  <button
                    onClick={() => sendLiveMessage()}
                    className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={!isAuthenticated || connecting || !liveConversation || !liveInput.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Staff will join shortly. Keep this window open for realtime updates.
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white hover:shadow-xl"
      >
        <MessageSquare className="h-4 w-4" />
        <span>{open ? 'Close' : 'Quick support'}</span>
      </button>
    </div>
  );
}


