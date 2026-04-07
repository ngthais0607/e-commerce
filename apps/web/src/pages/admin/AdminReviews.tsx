import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Star, MessageSquare, Edit2, Trash2, ChevronUp } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ReviewUser = { id: number; name: string } | null;
type ReviewProduct = { id: number; name: string } | null;

type AdminReview = {
  id: number;
  clientId: number;
  productId: number;
  rating: number;
  title?: string | null;
  comment?: string | null;
  adminReply: string | null;
  adminRepliedAt: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  user: ReviewUser;
  product: ReviewProduct;
};

type PaginatedReviews = {
  items: AdminReview[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const { toast } = useToast();
  const [data, setData] = useState<PaginatedReviews | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [expandedReplyId, setExpandedReplyId] = useState<number | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const fetchReviews = async (p: number) => {
    try {
      setLoading(true);
      const res = await api.get('/admin/reviews', { params: { page: p, pageSize: 20 } });
      setData(res.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.message || 'Failed to fetch reviews.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(page);
  }, [page]);

  const handleToggleReplyForm = (review: AdminReview) => {
    if (expandedReplyId === review.id) {
      setExpandedReplyId(null);
      return;
    }
    setExpandedReplyId(review.id);
    setReplyDrafts(prev => ({
      ...prev,
      [review.id]: review.adminReply ?? '',
    }));
  };

  const handleSaveReply = async (id: number, reply: string | null) => {
    try {
      setSavingId(id);
      const res = await api.patch(`/admin/reviews/${id}/reply`, { reply });
      setData(prev =>
        prev
          ? {
              ...prev,
              items: prev.items.map(r =>
                r.id === id
                  ? { ...r, adminReply: res.data.adminReply, adminRepliedAt: res.data.adminRepliedAt }
                  : r
              ),
            }
          : prev
      );
      setExpandedReplyId(null);
      toast({ title: reply === null ? 'Reply deleted' : 'Reply saved' });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.message || 'Failed to save reply.',
      });
    } finally {
      setSavingId(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.total ?? 0} total reviews
          </p>
        </div>
      </div>

      {(!data || data.items.length === 0) && !loading ? (
        <div className="text-center py-16 text-muted-foreground">No reviews found.</div>
      ) : (
        <div className="space-y-4">
          {data?.items.map(review => (
            <div
              key={review.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-border shadow-sm p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-foreground">
                      {review.user?.name ?? 'Unknown User'}
                    </span>
                    {review.isVerified && (
                      <span className="text-xs font-medium bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 px-2 py-0.5 rounded-full">
                        Verified
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    Product:{' '}
                    <span className="font-medium text-foreground">
                      {review.product?.name ?? `#${review.productId}`}
                    </span>
                  </div>
                  <StarRating rating={review.rating} />
                  {review.title && (
                    <p className="mt-2 text-sm font-medium text-foreground">{review.title}</p>
                  )}
                  {review.comment && (
                    <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
                  )}

                  {review.adminReply && expandedReplyId !== review.id && (
                    <div className="mt-3 border-l-2 border-sky-300 pl-3 bg-sky-50 dark:bg-sky-950/30 rounded-r-lg py-2 pr-2">
                      <p className="text-xs font-semibold text-sky-700 dark:text-sky-400 mb-0.5">
                        Shop Reply
                      </p>
                      <p className="text-sm text-sky-900 dark:text-sky-200">{review.adminReply}</p>
                    </div>
                  )}

                  {expandedReplyId === review.id && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        className="w-full rounded-lg border border-border bg-background text-sm p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-sky-400"
                        rows={3}
                        placeholder="Write a reply..."
                        value={replyDrafts[review.id] ?? ''}
                        onChange={e =>
                          setReplyDrafts(prev => ({ ...prev, [review.id]: e.target.value }))
                        }
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={savingId === review.id || !replyDrafts[review.id]?.trim()}
                          onClick={() =>
                            handleSaveReply(review.id, replyDrafts[review.id]?.trim() || null)
                          }
                        >
                          {savingId === review.id ? 'Saving…' : 'Save Reply'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setExpandedReplyId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex sm:flex-col gap-2 sm:items-end shrink-0">
                  {!review.adminReply && expandedReplyId !== review.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-sky-600 border-sky-200 hover:bg-sky-50"
                      onClick={() => handleToggleReplyForm(review)}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Reply
                    </Button>
                  )}
                  {review.adminReply && expandedReplyId !== review.id && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => handleToggleReplyForm(review)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit Reply
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-rose-500 border-rose-200 hover:bg-rose-50"
                        disabled={savingId === review.id}
                        onClick={() => setConfirmDeleteId(review.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Reply
                      </Button>
                    </>
                  )}
                  {expandedReplyId === review.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-muted-foreground"
                      onClick={() => setExpandedReplyId(null)}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                      Collapse
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={confirmDeleteId !== null} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reply?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the admin reply. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (confirmDeleteId !== null) {
                  handleSaveReply(confirmDeleteId, null);
                  setConfirmDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages || loading}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
