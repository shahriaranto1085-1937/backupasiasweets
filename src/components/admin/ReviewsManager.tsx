import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ChevronDown, Trash2, Search } from 'lucide-react';

type ReviewRow = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  reviewer_name: string | null;
  created_at: string;
  // joined
  products?: { name: string } | null;
};

type SortKey = 'rating_low' | 'rating_high' | 'newest' | 'oldest';

const sortLabels: Record<SortKey, string> = {
  rating_low: 'Rating: Low → High',
  rating_high: 'Rating: High → Low',
  newest: 'Newest First',
  oldest: 'Oldest First',
};

const ReviewsManager = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('rating_low');
  const [showSort, setShowSort] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    // Try join. If the relationship isn't present in your schema, you'll still get review data.
    const { data, error } = await supabase
      .from('reviews')
      .select('id,product_id,user_id,rating,comment,reviewer_name,created_at,products(name)')
      .limit(5000);

    if (error) {
      console.error(error);
      toast({ title: 'Failed to load reviews', description: error.message, variant: 'destructive' });
      setRows([]);
      setLoading(false);
      return;
    }

    setRows(((data as any) || []) as ReviewRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? rows.filter((r) => {
          const productName = (r.products?.name || '').toLowerCase();
          const comment = (r.comment || '').toLowerCase();
          const user = (r.user_id || '').toLowerCase();
          return productName.includes(q) || comment.includes(q) || user.includes(q);
        })
      : rows;

    return [...base].sort((a, b) => {
      if (sortBy === 'rating_low') return Number(a.rating) - Number(b.rating);
      if (sortBy === 'rating_high') return Number(b.rating) - Number(a.rating);
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      // newest
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [rows, search, sortBy]);

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return;
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) {
      toast({ title: 'Failed to delete review', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Review deleted' });
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-semibold">Khoj the Search</h2>
          <p className="text-sm text-muted-foreground mt-1">All reviews · sort & delete vulgar reviews</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product / comment / user id…"
              className="pl-9"
            />
          </div>

          <div className="relative shrink-0">
            <Button variant={showSort ? 'default' : 'outline'} onClick={() => setShowSort((v) => !v)}>
              Sort
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showSort ? 'rotate-180' : ''}`} />
            </Button>
            {showSort && (
              <div className="absolute right-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-lg py-2 min-w-[220px]">
                {(Object.keys(sortLabels) as SortKey[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setSortBy(k);
                      setShowSort(false);
                    }}
                    className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      sortBy === k ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-secondary'
                    }`}
                  >
                    {sortLabels[k]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filtered.length}</span> reviews
          </p>
          <Button variant="outline" onClick={fetchReviews} disabled={loading}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading reviews…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">No reviews found.</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((r) => (
              <div key={r.id} className="px-5 sm:px-6 py-4 flex items-start gap-4">
                <div className="w-14 flex-shrink-0">
                  <Badge className="w-full justify-center">{Number(r.rating).toFixed(1)}</Badge>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground truncate">
                      {r.products?.name || 'Unknown product'}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                  </div>

                  <p className="mt-1 text-sm text-foreground/90 whitespace-pre-line break-words">
                    {r.comment?.trim() ? r.comment.trim() : '—'}
                  </p>

                  <p className="mt-2 text-[11px] text-muted-foreground">
                    User: <span className="font-mono">{r.user_id}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => deleteReview(r.id)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:border-destructive/40 hover:bg-destructive/10 text-destructive flex-shrink-0"
                  title="Delete review"
                  aria-label="Delete review"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsManager;
