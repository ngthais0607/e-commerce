import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatPrice, formatDate } from '@/lib/utils';
import { CheckCircle, XCircle, RotateCcw, Loader2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type RefundStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface RefundItem {
  id: number;
  orderId: number;
  clientId: number;
  reason: string;
  status: RefundStatus;
  adminNote: string | null;
  requestedAt: string;
  resolvedAt: string | null;
  order: { orderNumber: string; total: number };
  client: { name: string; email: string };
}

interface PaginatedRefunds {
  items: RefundItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function AdminRefunds() {
  const { toast } = useToast();
  const [data, setData] = useState<PaginatedRefunds>({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [processing, setProcessing] = useState<number | null>(null);
  const [adminNote, setAdminNote] = useState<Record<number, string>>({});
  const [pendingResolve, setPendingResolve] = useState<{ id: number; status: 'APPROVED' | 'REJECTED' } | null>(null);

  useEffect(() => {
    fetchRefunds();
  }, [statusFilter]);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: '50' });
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get<PaginatedRefunds>(`/admin/refunds?${params}`);
      setData(res.data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load refund requests', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    setProcessing(id);
    try {
      await api.put(`/admin/refunds/${id}`, { status, adminNote: adminNote[id] || undefined });
      toast({
        title: status === 'APPROVED' ? 'Refund Approved' : 'Refund Rejected',
        description: status === 'APPROVED'
          ? 'Order has been cancelled and marked as refunded.'
          : 'Refund request has been rejected.',
      });
      fetchRefunds();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast({ title: 'Error', description: err.response?.data?.error || 'Failed to process refund', variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const statusBadge = (status: RefundStatus) => {
    if (status === 'PENDING') return <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 font-medium">⏳ Pending</span>;
    if (status === 'APPROVED') return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-medium">✅ Approved</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 font-medium">❌ Rejected</span>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-primary" />
            Refund Requests
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Review and process customer refund requests</p>
        </div>
        <span className="text-sm text-muted-foreground">{data.total} total</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['PENDING', 'APPROVED', 'REJECTED', ''] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : data.items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <RotateCcw className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No refund requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.items.map((item) => (
            <div key={item.id} className="border rounded-xl p-5 bg-card space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">Order #{item.order.orderNumber}</span>
                    {statusBadge(item.status)}
                    <span className="text-sm text-muted-foreground">·</span>
                    <span className="text-sm font-medium text-primary">{formatPrice(item.order.total)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.client.name} · {item.client.email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Requested {formatDate(item.requestedAt)}
                    {item.resolvedAt && ` · Resolved ${formatDate(item.resolvedAt)}`}
                  </p>
                </div>
              </div>

              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Customer reason:</p>
                <p className="text-sm">{item.reason}</p>
              </div>

              {item.adminNote && (
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Admin note:</p>
                  <p className="text-sm">{item.adminNote}</p>
                </div>
              )}

              {item.status === 'PENDING' && (
                <div className="space-y-3 pt-2 border-t">
                  <textarea
                    placeholder="Add an internal note (optional)..."
                    className="w-full px-3 py-2 border rounded-md text-sm resize-none h-16 bg-background"
                    value={adminNote[item.id] || ''}
                    onChange={(e) => setAdminNote((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={processing === item.id}
                      onClick={() => setPendingResolve({ id: item.id, status: 'APPROVED' })}
                    >
                      {processing === item.id ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1.5" />}
                      Approve & Refund
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive/40 hover:bg-destructive/10"
                      disabled={processing === item.id}
                      onClick={() => setPendingResolve({ id: item.id, status: 'REJECTED' })}
                    >
                      {processing === item.id ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <XCircle className="h-4 w-4 mr-1.5" />}
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!pendingResolve} onOpenChange={(open) => { if (!open) setPendingResolve(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingResolve?.status === 'APPROVED' ? 'Approve Refund?' : 'Reject Refund?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingResolve?.status === 'APPROVED'
                ? 'This will cancel the order and mark it as refunded. This action cannot be undone.'
                : 'The refund request will be rejected. The customer will be notified.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={pendingResolve?.status === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-destructive hover:bg-destructive/90'}
              onClick={() => {
                if (pendingResolve) {
                  handleResolve(pendingResolve.id, pendingResolve.status);
                  setPendingResolve(null);
                }
              }}
            >
              {pendingResolve?.status === 'APPROVED' ? 'Yes, Approve' : 'Yes, Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
