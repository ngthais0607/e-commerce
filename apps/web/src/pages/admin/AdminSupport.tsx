import { useEffect, useMemo, useState } from 'react';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Send, RefreshCw, MessageSquare, User } from 'lucide-react';

const formatMessageTime = (date: string) =>
  new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

type Conversation = {
  id: number;
  userId: number;
  status: 'OPEN' | 'ASSIGNED' | 'CLOSED';
  assignedStaffId: number | null;
  lastMessageAt: string;
  createdAt: string;
  userName?: string | null;
  userEmail?: string | null;
};

type SupportMessage = {
  id: number;
  conversationId: number;
  senderRole: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  message: string;
  createdAt: string;
};

export default function AdminSupport() {
  const { token, user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const socket = useMemo(() => getSocket(token ?? null), [token]);

  useEffect(() => {
    if (!token) return;
    fetchConversations();
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    socket.on('support-new', (payload: { conversation: Conversation }) => {
      setConversations((prev) => [payload.conversation, ...prev]);
    });
    socket.on('support-message', (payload: { conversationId: number; message: SupportMessage }) => {
      if (selected && payload.conversationId === selected.id) {
        setMessages((prev) => [...prev, payload.message]);
      }
    });
    return () => {
      socket.off('support-new');
      socket.off('support-message');
    };
  }, [socket, selected]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/support/conversations?status=OPEN,ASSIGNED,CLOSED');
      setConversations(res.data.conversations || []);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
      const description = err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message ?? 'Please try again.';
      toast({
        variant: 'destructive',
        title: 'Failed to load conversations',
        description,
      });
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (c: Conversation) => {
    setSelected(c);
    setMessages([]);
    setLoadingMsgs(true);
    try {
      await api.post(`/admin/support/conversations/${c.id}/claim`).catch(() => {});
      const res = await api.get(`/admin/support/conversations/${c.id}/messages`);
      setMessages(res.data.messages || []);
      socket?.emit('join-support-conv', c.id);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: 'destructive',
        title: 'Failed to open conversation',
        description: err?.message || 'Please try again.',
      });
    } finally {
      setLoadingMsgs(false);
    }
  };

  const sendMessage = async () => {
    if (!selected || !newMsg.trim()) return;
    const text = newMsg.trim();
    setNewMsg('');
    try {
      const res = await api.post(`/admin/support/conversations/${selected.id}/messages`, {
        message: text,
      });
      setMessages((prev) => [...prev, res.data]);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast({
        variant: 'destructive',
        title: 'Failed to send message',
        description: error?.message || 'Please try again.',
      });
    }
  };

  const getStatusBadgeClass = (status: Conversation['status']) => {
    switch (status) {
      case 'OPEN':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'ASSIGNED':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300';
      case 'CLOSED':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getBubbleStyles = (role: SupportMessage['senderRole']) => {
    // Messenger-style: "you" (STAFF) là bubble xanh bên phải, khách bubble xám bên trái
    if (role === 'STAFF') {
      return 'bg-sky-500 text-white shadow-sm'; // you
    }
    if (role === 'CUSTOMER') {
      return 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50 shadow-sm'; // customer
    }
    // ADMIN
    return 'bg-violet-500/90 text-white shadow-sm';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] min-h-[480px] rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0">
        {/* Left: Conversations list - cùng tông với chat user (compact) */}
        <aside className="lg:col-span-4 flex flex-col border-r border-border bg-muted/20 min-h-0">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Conversations</span>
            </div>
            <Button size="sm" variant="ghost" onClick={fetchConversations} disabled={loading} className="h-8 w-8 p-0 shrink-0">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="p-4 flex justify-center">
                <LoadingSpinner size="sm" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 flex flex-col items-center justify-center text-center text-muted-foreground">
                <User className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No conversations yet.</p>
                <p className="text-[11px] mt-1">When customers use Live chat, they appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`w-full text-left px-3 py-2.5 transition-colors hover:bg-background/80 ${
                      selected?.id === c.id ? 'bg-primary/10 dark:bg-primary/20 border-l-4 border-l-primary' : ''
                    }`}
                    onClick={() => selectConversation(c)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-medium text-muted-foreground">#{c.id}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-medium text-foreground truncate">
                            {c.userName?.trim() || c.userEmail || `Customer #${c.userId}`}
                          </span>
                          <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${getStatusBadgeClass(c.status)}`}>
                            {c.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          #{c.id}
                          {c.assignedStaffId != null && (
                            <span> · {c.assignedStaffId === user?.id ? 'You' : `Staff #${c.assignedStaffId}`}</span>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{formatDate(c.lastMessageAt)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right: Chat area - cùng style header/empty như chat user */}
        <main className="lg:col-span-8 flex flex-col min-h-0 bg-background">
          {/* Chat header - compact như Support Bot */}
          <header className="flex items-center justify-between px-3 py-2.5 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-xs shrink-0">
                {selected ? `#${selected.id}` : '—'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {selected
                    ? (selected.userName?.trim() || selected.userEmail || `Customer #${selected.userId}`)
                    : 'Select a conversation'}
                </p>
                <p className="text-[11px] text-muted-foreground capitalize">
                  {selected ? `#${selected.id} · ${selected.status.toLowerCase()}` : 'Pick one from the list'}
                </p>
              </div>
            </div>
          </header>

          {/* Messages - bubble style giống Support Bot */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
            {loadingMsgs ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                Loading messages...
              </div>
            ) : !selected ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mb-2 opacity-40" />
                <p className="text-sm">Pick a conversation to view and reply.</p>
                <p className="text-[11px] mt-1">Select one from the list on the left.</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[140px] text-sm text-muted-foreground">
                <p className="text-sm">No messages yet.</p>
                <p className="text-[11px] mt-1">Type below to send the first reply.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isCustomer = m.senderRole === 'CUSTOMER';
                const isStaffRole = m.senderRole === 'STAFF';
                const label = m.senderRole === 'CUSTOMER' ? 'Customer' : isStaffRole ? (user?.role === 'STAFF' ? 'You' : 'Staff') : 'Admin';
                return (
                  <div key={m.id} className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] px-3.5 py-2 rounded-2xl whitespace-pre-wrap ${isCustomer ? 'rounded-bl-md' : 'rounded-br-md'} ${getBubbleStyles(m.senderRole)}`}>
                      <p className="text-[11px] font-medium opacity-90 mb-0.5">{label}</p>
                      <p className="text-sm leading-snug">{m.message}</p>
                      <p className={`text-[11px] mt-1 ${isCustomer ? 'text-slate-600 dark:text-slate-400' : 'text-white/80'}`}>
                        {formatMessageTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input bar - cùng style với chat user */}
          <div className="p-2.5 border-t border-border shrink-0">
            <div className="flex items-center gap-2">
              <input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                placeholder={selected ? 'Type a message...' : 'Select a conversation first'}
                disabled={!selected}
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!newMsg.trim() || !selected}
                className="shrink-0 rounded-full h-9 w-9"
                aria-label="Send"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


