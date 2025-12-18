import { useEffect, useMemo, useState } from 'react';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';

type Conversation = {
  id: number;
  userId: number;
  status: 'OPEN' | 'ASSIGNED' | 'CLOSED';
  assignedStaffId: number | null;
  lastMessageAt: string;
  createdAt: string;
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
      const err = error as { message?: string };
      toast({
        variant: 'destructive',
        title: 'Failed to load conversations',
        description: err?.message || 'Please try again.',
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Conversations list */}
      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Conversations</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Live chats between customers and staff
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchConversations} disabled={loading}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="border rounded-lg divide-y max-h-[520px] overflow-y-auto bg-muted/40 dark:bg-slate-900/40">
            {loading ? (
              <div className="p-3 text-sm text-muted-foreground">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">No conversations</div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  className={`w-full text-left px-3 py-3 transition-colors hover:bg-background/70 dark:hover:bg-slate-900/70 ${
                    selected?.id === c.id
                      ? 'bg-background dark:bg-slate-900 border-l-4 border-l-indigo-500'
                      : ''
                  }`}
                  onClick={() => selectConversation(c)}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="text-sm font-semibold">
                      #{c.id}{' '}
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ml-1 ${getStatusBadgeClass(
                          c.status
                        )}`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(c.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Customer ID: {c.userId}</span>
                    <span>
                      {c.assignedStaffId
                        ? c.assignedStaffId === user?.id
                          ? 'You'
                          : `Staff: ${c.assignedStaffId}`
                        : 'Unassigned'}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conversation detail */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>
            {selected ? `Conversation #${selected.id}` : 'Select a conversation'}
            {selected?.assignedStaffId && (
              <span className="ml-2 text-sm text-muted-foreground">Assigned: {selected.assignedStaffId}</span>
            )}
          </CardTitle>
        </CardHeader>
          <CardContent className="space-y-4">
          {loadingMsgs ? (
            <div className="text-sm text-muted-foreground">Loading messages...</div>
          ) : !selected ? (
            <div className="text-sm text-muted-foreground">Pick a conversation to view messages.</div>
          ) : (
            <>
              <div className="h-80 overflow-y-auto border rounded-2xl p-4 bg-gradient-to-b from-muted/60 via-background to-muted/40 dark:from-slate-900/80 dark:via-slate-950 dark:to-slate-900/70 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No messages yet.</div>
                ) : (
                  messages.map((m) => {
                    const isCustomer = m.senderRole === 'CUSTOMER';
                    const isStaff = m.senderRole === 'STAFF';
                    const label =
                      m.senderRole === 'CUSTOMER'
                        ? 'Customer'
                        : isStaff
                        ? user?.role === 'STAFF'
                          ? 'You'
                          : 'Staff'
                        : 'Admin';

                    return (
                      <div
                        key={m.id}
                        className={`flex w-full ${isCustomer ? 'justify-start' : 'justify-end'}`}
                      >
                        {/* Bubble wrapper: limit width giống Messenger, không kéo full màn hình */}
                        <div className="max-w-[55%] space-y-1">
                          <div
                            className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              isCustomer
                                ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                                : isStaff
                                ? 'bg-sky-500/90 text-white'
                                : 'bg-violet-500/90 text-white'
                            } ${isCustomer ? '' : 'self-end'}`}
                          >
                            <span>{label}</span>
                          </div>
                          <div
                            className={`px-3 py-2 text-sm whitespace-pre-wrap rounded-2xl ${
                              isCustomer ? 'rounded-bl-sm' : 'rounded-br-sm'
                            } ${getBubbleStyles(m.senderRole)}`}
                          >
                            {m.message}
                          </div>
                          <div
                            className={`text-[11px] text-muted-foreground ${
                              isCustomer ? '' : 'text-right'
                            }`}
                          >
                            {formatDate(m.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="flex gap-2">
                <textarea
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm resize-none h-20 bg-background dark:bg-slate-950/60"
                  placeholder="Type a reply..."
                />
                <Button onClick={sendMessage} disabled={!newMsg.trim() || !selected}>
                  Send
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


