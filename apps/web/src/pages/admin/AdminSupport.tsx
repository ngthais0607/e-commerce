import { useEffect, useMemo, useRef, useState } from 'react';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';
import { Send, RefreshCw, MessageSquare, Search, CheckCheck, Clock, ChevronDown, ArrowLeft } from 'lucide-react';

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

function getInitials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email ? email[0].toUpperCase() : '?';
}

function getAvatarColor(id: number): string {
  const colors = [
    'bg-sky-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500',
    'bg-emerald-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
  ];
  return colors[id % colors.length];
}

const STATUS_META = {
  OPEN:     { label: 'Open',     cls: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300' },
  ASSIGNED: { label: 'Assigned', cls: 'bg-sky-100 text-sky-700 ring-1 ring-sky-300' },
  CLOSED:   { label: 'Closed',   cls: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200' },
};

export default function AdminSupport() {
  const { token, user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
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
        scrollToBottom();
      }
    });
    return () => {
      socket.off('support-new');
      socket.off('support-message');
    };
  }, [socket, selected]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 120);
  };

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/support/conversations?status=OPEN,ASSIGNED,CLOSED');
      setConversations(res.data.conversations || []);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
      toast({
        variant: 'destructive',
        title: 'Failed to load conversations',
        description: err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message ?? 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (c: Conversation) => {
    setSelected(c);
    setMobileChatOpen(true);
    setMessages([]);
    setLoadingMsgs(true);
    try {
      await api.post(`/admin/support/conversations/${c.id}/claim`).catch(() => {});
      const res = await api.get(`/admin/support/conversations/${c.id}/messages`);
      setMessages(res.data.messages || []);
      socket?.emit('join-support-conv', c.id);
      setTimeout(() => inputRef.current?.focus(), 100);
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
      const res = await api.post(`/admin/support/conversations/${selected.id}/messages`, { message: text });
      setMessages((prev) => [...prev, res.data]);
      toast({ title: 'Message sent' });
    } catch (err: unknown) {
      const error = err as { message?: string };
      setNewMsg(text); // restore message on error
      toast({
        variant: 'destructive',
        title: 'Failed to send message',
        description: error?.message || 'Please try again.',
      });
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.userName?.toLowerCase().includes(q) ||
        c.userEmail?.toLowerCase().includes(q) ||
        String(c.id).includes(q),
    );
  }, [conversations, search]);

  // Group messages by date for dividers
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: SupportMessage[] }[] = [];
    for (const msg of messages) {
      const d = new Date(msg.createdAt).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
      });
      const last = groups[groups.length - 1];
      if (last?.date === d) {
        last.messages.push(msg);
      } else {
        groups.push({ date: d, messages: [msg] });
      }
    }
    return groups;
  }, [messages]);

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[480px] rounded-2xl border border-border bg-card overflow-hidden shadow-md">
      {/* ── Left sidebar ─────────────────────────────────────────── */}
      <aside className={`${mobileChatOpen ? 'hidden sm:flex' : 'flex'} w-full sm:w-80 flex-shrink-0 flex-col border-r border-border bg-muted/10`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">Support Chat</span>
          </div>
          <button
            type="button"
            onClick={fetchConversations}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2.5 border-b border-border">
          <div className="flex items-center gap-2 bg-muted/60 rounded-xl px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none text-foreground"
            />
          </div>
        </div>

        {/* Count */}
        <div className="px-4 py-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            {filtered.length} conversation{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground gap-2 text-sm">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-muted-foreground gap-2">
              <MessageSquare className="h-8 w-8 opacity-30" />
              {search ? (
                <>
                  <p className="text-sm font-medium">No results for "{search}"</p>
                  <p className="text-xs">Try a different name or email.</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">No conversations</p>
                  <p className="text-xs">Customers using live chat will appear here.</p>
                </>
              )}
            </div>
          ) : (
            <div className="py-1">
              {filtered.map((c) => {
                const isActive = selected?.id === c.id;
                const meta = STATUS_META[c.status] ?? STATUS_META.OPEN;
                const displayName = c.userName?.trim() || c.userEmail || `Customer #${c.userId}`;
                const initials = getInitials(c.userName, c.userEmail);
                const avatarBg = getAvatarColor(c.userId);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectConversation(c)}
                    className={`w-full text-left px-3 py-3 mx-0 flex items-center gap-3 transition-all hover:bg-muted/50 ${
                      isActive
                        ? 'bg-primary/8 border-l-[3px] border-l-primary pl-[9px]'
                        : 'border-l-[3px] border-l-transparent'
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full ${avatarBg} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                      {initials}
                    </div>
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-sm font-semibold truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                          {displayName}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {formatDate(c.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${meta.cls}`}>
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate">
                          #{c.id}
                          {c.assignedStaffId != null && (
                            <> · {c.assignedStaffId === user?.id ? 'You' : `Staff #${c.assignedStaffId}`}</>
                          )}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* ── Main chat area ────────────────────────────────────────── */}
      <main className={`${mobileChatOpen ? 'flex' : 'hidden sm:flex'} flex-col flex-1 min-w-0 bg-background`}>
        {/* Chat header */}
        {selected ? (
          <header className="flex items-center gap-3 px-5 py-3 border-b border-border bg-background/95 backdrop-blur shrink-0 shadow-sm">
            <button
              type="button"
              onClick={() => setMobileChatOpen(false)}
              className="sm:hidden p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className={`w-10 h-10 rounded-full ${getAvatarColor(selected.userId)} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow`}>
              {getInitials(selected.userName, selected.userEmail)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">
                {selected.userName?.trim() || selected.userEmail || `Customer #${selected.userId}`}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_META[selected.status]?.cls ?? ''}`}>
                  {STATUS_META[selected.status]?.label ?? selected.status}
                </span>
                {selected.userEmail && (
                  <span className="text-[11px] text-muted-foreground truncate">{selected.userEmail}</span>
                )}
              </div>
            </div>
          </header>
        ) : (
          <header className="flex items-center gap-3 px-5 py-3 border-b border-border bg-background/95 shrink-0">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Select a conversation</p>
              <p className="text-[11px] text-muted-foreground">Pick one from the list</p>
            </div>
          </header>
        )}

        {/* Messages */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto min-h-0 px-5 py-4"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--border) / 0.4) 1px, transparent 0)', backgroundSize: '24px 24px' }}
        >
          {loadingMsgs ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading messages…</span>
            </div>
          ) : !selected ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <MessageSquare className="h-7 w-7 opacity-50" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Pick a conversation to view and reply.</p>
                <p className="text-xs mt-1 opacity-70">Select one from the list on the left.</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <MessageSquare className="h-8 w-8 opacity-30" />
              <p className="text-sm">No messages yet. Send the first reply below.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {groupedMessages.map((group) => (
                <div key={group.date}>
                  {/* Date divider */}
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[11px] text-muted-foreground font-medium px-2 py-0.5 bg-muted rounded-full">
                      {group.date}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {group.messages.map((m, idx) => {
                    const isCustomer = m.senderRole === 'CUSTOMER';
                    const isConsecutive =
                      idx > 0 && group.messages[idx - 1].senderRole === m.senderRole;
                    const senderName =
                      m.senderRole === 'CUSTOMER'
                        ? selected.userName?.trim() || 'Customer'
                        : m.senderRole === 'STAFF'
                        ? user?.role === 'STAFF' ? 'You (Staff)' : 'Staff'
                        : 'Admin';

                    return (
                      <div
                        key={m.id}
                        className={`flex ${isCustomer ? 'justify-start' : 'justify-end'} ${isConsecutive ? 'mt-0.5' : 'mt-3'}`}
                      >
                        {/* Customer avatar placeholder */}
                        {isCustomer && (
                          <div className={`w-7 h-7 rounded-full shrink-0 mr-2 mt-auto ${isConsecutive ? 'invisible' : getAvatarColor(selected.userId)} flex items-center justify-center text-white text-[10px] font-bold`}>
                            {!isConsecutive && getInitials(selected.userName, selected.userEmail)}
                          </div>
                        )}

                        <div className={`max-w-[70%] flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}>
                          {!isConsecutive && (
                            <span className="text-[10px] text-muted-foreground mb-1 px-1">
                              {senderName}
                            </span>
                          )}
                          <div
                            className={`px-3.5 py-2.5 shadow-sm text-sm leading-relaxed whitespace-pre-wrap break-words ${
                              isCustomer
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 border border-border rounded-2xl rounded-bl-sm'
                                : m.senderRole === 'ADMIN'
                                ? 'bg-violet-600 text-white rounded-2xl rounded-br-sm'
                                : 'bg-sky-500 text-white rounded-2xl rounded-br-sm'
                            }`}
                          >
                            {m.message}
                          </div>
                          <div className={`flex items-center gap-1 mt-1 px-1 ${isCustomer ? '' : 'flex-row-reverse'}`}>
                            <span className="text-[10px] text-muted-foreground">{formatMessageTime(m.createdAt)}</span>
                            {!isCustomer && <CheckCheck className="h-3 w-3 text-muted-foreground" />}
                          </div>
                        </div>

                        {/* Staff/Admin avatar placeholder */}
                        {!isCustomer && (
                          <div className={`w-7 h-7 rounded-full shrink-0 ml-2 mt-auto ${isConsecutive ? 'invisible' : m.senderRole === 'ADMIN' ? 'bg-violet-600' : 'bg-sky-500'} flex items-center justify-center text-white text-[10px] font-bold`}>
                            {!isConsecutive && (user?.name ? getInitials(user.name) : 'S')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Scroll-to-bottom button */}
        {showScrollBtn && (
          <div className="absolute bottom-20 right-8">
            <button
              type="button"
              onClick={scrollToBottom}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Input bar */}
        <div className="px-4 py-3 border-t border-border bg-background shrink-0">
          <div className="flex items-end gap-2.5 bg-muted/40 border border-border rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50 transition-all">
            <textarea
              ref={inputRef}
              value={newMsg}
              onChange={(e) => {
                setNewMsg(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              rows={1}
              className="flex-1 min-w-0 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed disabled:opacity-50 py-1"
              placeholder={selected ? 'Type a reply… (Enter to send, Shift+Enter for newline)' : 'Select a conversation first'}
              disabled={!selected}
              style={{ maxHeight: '120px', overflowY: 'auto' }}
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!newMsg.trim() || !selected}
              className="shrink-0 rounded-xl h-8 w-8 bg-primary hover:bg-primary/90 shadow-sm"
              aria-label="Send"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </main>
    </div>
  );
}
