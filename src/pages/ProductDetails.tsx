import { useState, useEffect, type MouseEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SupportTicketWidget from '@/components/SupportTicketWidget';
import { ArrowLeft, Star, Package, ShieldCheck, Quote, User, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

interface Product {
  id: string;
  name: string;
  category_id: string;
  price: number;
  details: string;
  image_url: string;
  categories?: { name: string } | null;
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  reviewer_name: string;
  created_at: string;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const StarRating = ({
  rating,
  onRate,
  interactive = false,
  size = 'md',
}: {
  rating: number;
  onRate?: (r: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md';
}) => {
  const [hover, setHover] = useState<number>(0);
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const display = hover || rating;

  const getValueFromEvent = (starIndex: number, e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const half = x <= rect.width / 2;
    // 0.5 steps
    const v = half ? starIndex - 0.5 : starIndex;
    return clamp(Math.round(v * 2) / 2, 0.5, 5);
  };

  const renderStar = (starIndex: number) => {
    const fill = clamp((display - (starIndex - 1)) * 100, 0, 100);
    return (
      <span className="relative inline-block">
        <Star className={`${sz} text-muted-foreground/30`} />
        <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill}%` }}>
          <Star className={`${sz} fill-primary text-primary`} />
        </span>
      </span>
    );
  };

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          aria-label={interactive ? `Rate ${i} stars` : undefined}
          onMouseMove={(e) => {
            if (!interactive) return;
            setHover(getValueFromEvent(i, e));
          }}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={(e) => {
            if (!interactive) return;
            onRate?.(getValueFromEvent(i, e));
          }}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          {renderStar(i)}
        </button>
      ))}
    </div>
  );
};

const ProductDetails = () => {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);

  const fetchReviews = async (productId: string) => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    setReviews((data as Review[]) || []);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('id', id!)
        .maybeSingle();

      if (data) {
        setProduct(data as any);
        fetchReviews(id!);

        const { data: sameCat } = await supabase
          .from('products')
          .select('*, categories(name)')
          .eq('category_id', (data as any).category_id)
          .neq('id', id!)
          .limit(8);

        let items = (sameCat as any) || [];
        if (items.length < 6) {
          const existingIds = [id!, ...items.map((i: any) => i.id)];
          const { data: more } = await supabase
            .from('products')
            .select('*, categories(name)')
            .not('id', 'in', `(${existingIds.join(',')})`)
            .order('created_at', { ascending: false })
            .limit(8 - items.length);
          items = [...items, ...((more as any) || [])];
        }
        setRelated(items.slice(0, 8));
      }
      setLoading(false);
    };

    if (id) {
      fetchProduct();
      setExistingReview(null);
      setMyRating(0);
      setMyComment('');
    }
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    const existing = reviews.find(r => r.user_id === user.id);
    if (existing) {
      setExistingReview(existing);
      setMyRating(existing.rating);
      setMyComment(existing.comment || '');
    } else {
      setExistingReview(null);
    }
  }, [reviews, user, id]);

  const handleSubmitReview = async () => {
    if (!user || !id || myRating === 0) {
      toast({ title: 'Please select a rating', variant: 'destructive' });
      return;
    }
    setSubmittingReview(true);

    // Users should not choose their display name for reviews.
    // We store the authenticated user id as reviewer_name.
    const reviewerName = user.id;

    if (existingReview) {
      await supabase
        .from('reviews')
        .update({ rating: myRating, comment: myComment.trim() || null, reviewer_name: reviewerName })
        .eq('id', existingReview.id);
      toast({ title: 'Review updated!' });
    } else {
      await supabase
        .from('reviews')
        .insert({ product_id: id, user_id: user.id, rating: myRating, comment: myComment.trim() || null, reviewer_name: reviewerName });
      toast({ title: 'Review submitted!' });
    }

    await fetchReviews(id);
    setSubmittingReview(false);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (error) {
      toast({ title: 'Failed to delete review', variant: 'destructive' });
    } else {
      toast({ title: 'Review deleted' });
      await fetchReviews(id!);
    }
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-2xl font-display font-semibold">Product not found</h1>
          <Link to="/" className="text-primary mt-4 inline-block hover:underline">← Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar showSearch={false} />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <Link to="/products" className="inline-flex items-center gap-2 text-primary hover:underline mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to products
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
            {/* Image */}
            <div className="rounded-2xl overflow-hidden shadow-warm bg-card">
              <img src={product.image_url} alt={product.name} loading="eager" className="w-full aspect-square object-cover" />
            </div>

            {/* Info */}
            <div className="flex flex-col justify-center space-y-5">
              <Badge variant="outline" className="w-fit border-primary/30 text-primary text-xs uppercase tracking-widest">
                {product.categories?.name || 'Uncategorized'}
              </Badge>

              <h1 className="text-2xl md:text-4xl font-display font-bold text-foreground leading-tight">
                {product.name}
              </h1>

              {reviews.length > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating rating={avgRating} />
                  <span className="text-sm text-muted-foreground">
                    {avgRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}

              <div className="flex items-baseline gap-3">
                <span className="text-3xl md:text-4xl font-bold text-primary">৳{Number(product.price).toFixed(0)}</span>
                <span className="text-sm text-muted-foreground">/kg</span>
              </div>

              {product.details && (
                <div className="bg-secondary/50 rounded-xl p-4 md:p-5 border border-border/50">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Description</h3>
                  <p className="text-foreground/80 leading-relaxed text-sm md:text-base whitespace-pre-line">{product.details}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="flex flex-col items-center text-center gap-1.5 p-3 rounded-xl bg-secondary/30 border border-border/30">
                  <Package className="w-5 h-5 text-primary" />
                  <span className="text-[11px] md:text-xs text-muted-foreground font-medium">Fresh Daily</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1.5 p-3 rounded-xl bg-secondary/30 border border-border/30">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span className="text-[11px] md:text-xs text-muted-foreground font-medium">100% Pure</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1.5 p-3 rounded-xl bg-secondary/30 border border-border/30">
                  <Star className="w-5 h-5 text-primary" />
                  <span className="text-[11px] md:text-xs text-muted-foreground font-medium">Premium Quality</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <section className="mt-12 lg:mt-20">
            <div className="flex items-center gap-3 mb-8">
              <h2 className="text-xl md:text-2xl font-display font-semibold">Customer Reviews</h2>
              {reviews.length > 0 && (
                <Badge variant="outline" className="border-primary/30 text-primary">
                  {avgRating.toFixed(1)} ★ · {reviews.length}
                </Badge>
              )}
            </div>

            {/* Write review form */}
            <div className="bg-card rounded-2xl border border-border shadow-soft p-5 md:p-8 mb-10">
              {user ? (
                <div className="space-y-4">
                  <h3 className="font-display font-semibold text-foreground">
                    {existingReview ? '✏️ Update your review' : '⭐ Rate this product'}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground font-medium mb-1 block">Your rating</label>
                      <StarRating rating={myRating} onRate={setMyRating} interactive />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground font-medium mb-1 block">Your user id</label>
                      <div className="h-10 rounded-xl border border-border bg-background px-4 flex items-center text-sm text-muted-foreground break-all">
                        {user.id}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1 block">Comment (optional)</label>
                    <textarea
                      value={myComment}
                      onChange={e => setMyComment(e.target.value)}
                      placeholder="Share your experience with this sweet..."
                      rows={3}
                      maxLength={500}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                  </div>
                  <Button onClick={handleSubmitReview} disabled={submittingReview || myRating === 0} className="rounded-xl">
                    {existingReview ? 'Update Review' : 'Submit Review'}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">
                    <Link to="/auth" className="text-primary hover:underline font-semibold">Sign in</Link> to leave a review
                  </p>
                </div>
              )}
            </div>

            {/* Review list */}
            {reviews.length === 0 ? (
              <div className="text-center py-12 bg-secondary/20 rounded-2xl border border-border/30">
                <Star className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No reviews yet. Be the first to share your experience!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map(r => (
                  <div key={r.id} className="bg-card rounded-2xl p-5 border border-border shadow-soft relative">
                    <Quote className="absolute top-4 right-4 w-6 h-6 text-primary/10" />
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{r.reviewer_name}</p>
                        <p className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      </div>
                      {r.user_id === user?.id && (
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">You</Badge>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteReview(r.id)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <StarRating rating={r.rating} size="sm" />
                    {r.comment && (
                      <p className="text-sm text-foreground/70 leading-relaxed mt-2">{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-16 lg:mt-24">
            <h2 className="text-xl md:text-2xl font-display font-semibold mb-6">
              You May Also Like
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
              {related.map((item) => (
                <Link
                  key={item.id}
                  to={`/product/${item.id}`}
                  className="group relative rounded-2xl overflow-hidden aspect-square"
                >
                  {/* Full-bleed image */}
                  <img
                    src={item.image_url}
                    alt={item.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5" />

                  {/* Category pill */}
                  <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10">
                    <span className="bg-white/90 backdrop-blur-sm text-foreground text-[9px] sm:text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
                      {item.categories?.name || 'Uncategorized'}
                    </span>
                  </div>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 z-10">
                    {/* ✅ Same name sizing style */}
                    <h3 className="font-display text-base sm:text-xl font-bold text-white leading-tight line-clamp-2 drop-shadow-md">
                      {item.name}
                    </h3>

                    <div className="flex items-center justify-between mt-1.5 sm:mt-2">
                      <span className="bg-primary text-primary-foreground text-[11px] sm:text-sm font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">
                        ৳{Number(item.price).toFixed(0)}/kg
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
        </div>
      </main>
      <Footer />
      <SupportTicketWidget />
    </div>
  );
};

export default ProductDetails;
