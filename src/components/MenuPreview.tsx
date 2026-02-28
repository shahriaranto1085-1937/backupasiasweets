import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Star, ArrowRight, MoreVertical, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  details?: string | null;
  categories?: { name: string } | null;
  created_at?: string;
}

interface ReviewSummary {
  product_id: string;
  avg: number;
  count: number;
}

function useCloseHandlers(isOpen: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const onMouseDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [isOpen, onClose]);

  return ref;
}

const HomeProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewMap, setReviewMap] = useState<Record<string, ReviewSummary>>({});
  const [openId, setOpenId] = useState<string | null>(null);

  const close = () => setOpenId(null);
  const panelRef = useCloseHandlers(!!openId, close);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const [{ data: pData, error: pErr }, { data: rData, error: rErr }] = await Promise.all([
        supabase
          .from('products')
          .select('id,name,price,image_url,details,created_at,categories(name)')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase.from('reviews').select('product_id, rating'),
      ]);

      if (pErr) console.error(pErr);
      if (rErr) console.error(rErr);

      const prods = ((pData as any) || []) as Product[];
      setProducts(prods);

      const map: Record<string, { total: number; count: number }> = {};
      ((rData as any) || []).forEach((r: { product_id: string; rating: number }) => {
        if (!map[r.product_id]) map[r.product_id] = { total: 0, count: 0 };
        map[r.product_id].total += Number(r.rating);
        map[r.product_id].count += 1;
      });

      const summaries: Record<string, ReviewSummary> = {};
      Object.entries(map).forEach(([pid, v]) => {
        summaries[pid] = {
          product_id: pid,
          avg: v.count ? parseFloat((v.total / v.count).toFixed(1)) : 0,
          count: v.count,
        };
      });
      setReviewMap(summaries);

      setLoading(false);
    };

    fetchData();
  }, []);

  const items = useMemo(() => products.slice(0, 6), [products]);

  return (
    <section id="products" className="pt-2 sm:pt-4 pb-14 lg:pb-20 bg-secondary/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <span className="inline-flex items-center gap-1.5 text-primary font-medium text-sm uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Our Collection
          </span>
          <h2 className="section-title mt-2">Sweet Menu</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Discover our handcrafted selection of traditional Asian sweets.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">No products available yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-5 lg:gap-6">
              {items.map((item) => {
                const rev = reviewMap[item.id];
                const isOpen = openId === item.id;

                return (
                  <div key={item.id} className="relative">
                    {/* Card (dot button is INSIDE so it never overlaps outside the card in mobile) */}
                    <Link
                      to={`/product/${item.id}`}
                      className="group relative block rounded-2xl overflow-hidden aspect-[3/3.5]"
                      onClick={(e) => {
                        if (isOpen) e.preventDefault();
                      }}
                    >
                      <img
                        src={item.image_url}
                        alt={item.name}
                        loading="lazy"
                        className={[
                          'absolute inset-0 w-full h-full object-cover transition-all duration-500',
                          'group-hover:scale-110',
                          isOpen ? 'scale-105 blur-[6px] brightness-75' : '',
                        ].join(' ')}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5" />

                      {/* Category pill */}
                      <div className="absolute top-2 left-2 z-10">
                        <span className="bg-white/90 backdrop-blur-sm text-foreground text-[8px] sm:text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
                          {item.categories?.name || 'Uncategorized'}
                        </span>
                      </div>

                      {/* Bottom info */}
                      <div
                        className={[
                          'absolute bottom-0 left-0 right-0 p-2.5 sm:p-5 z-10 transition-all duration-500',
                          isOpen ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0',
                        ].join(' ')}
                      >
                        <h3 className="font-display text-base sm:text-xl font-bold text-white leading-tight drop-shadow-md line-clamp-2">
                          {item.name}
                        </h3>

                        <div className="flex items-center justify-between mt-1.5 sm:mt-2">
                          <span className="bg-primary text-primary-foreground text-[10px] sm:text-sm font-bold px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                            ৳{Number(item.price).toFixed(0)}/kg
                          </span>

                          {rev && rev.count > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-primary text-primary" />
                              <span className="text-white text-[10px] sm:text-xs font-semibold drop-shadow-md">
                                {rev.avg.toFixed(1)}
                              </span>
                              <span className="text-white/60 text-[9px] sm:text-[11px]">({rev.count})</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Dot / X button (kept BELOW navbar/search bar; clipped within card) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenId((prev) => (prev === item.id ? null : item.id));
                        }}
                        className={[
                          'absolute top-2 right-2 z-20 inline-flex items-center justify-center w-9 h-9 rounded-full',
                          'bg-black/35 backdrop-blur-md border border-white/15 text-white',
                          'hover:bg-black/55 hover:border-white/25 transition-all duration-300',
                          isOpen ? 'bg-black/60' : '',
                        ].join(' ')}
                        aria-label={isOpen ? 'Close details' : 'Open details'}
                      >
                        <span className={['transition-transform duration-300', isOpen ? 'rotate-90' : 'rotate-0'].join(' ')}>
                          {isOpen ? <X className="w-4 h-4" /> : <MoreVertical className="w-4 h-4" />}
                        </span>
                      </button>
                    </Link>

                    {/* Details overlay (render ONLY when open to prevent click/stacking bugs) */}
                    {isOpen && (
                      <div className="absolute bottom-0 left-0 right-0 z-10 p-2.5 sm:p-5">
                        <div
                          ref={panelRef}
                          className="w-full rounded-2xl border border-white/15 bg-black/40 backdrop-blur-xl shadow-2xl"
                        >
                          <div className="px-4 pt-4 pb-2">
                            <p className="text-white font-semibold leading-tight line-clamp-1 text-sm sm:text-base">
                              {item.name}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-[11px] sm:text-xs text-white/70">
                              <span className="uppercase tracking-wider">
                                {item.categories?.name || 'Uncategorized'}
                              </span>
                              <span className="text-white/30">•</span>
                              <span className="font-semibold text-white/85">৳{Number(item.price).toFixed(0)}/kg</span>
                            </div>
                          </div>

                          <div className="px-4 pb-4">
                            <div className="max-h-[95px] sm:max-h-[140px] overflow-y-auto pr-1">
                              <p className="text-white/90 text-[12px] sm:text-sm leading-relaxed whitespace-pre-line">
                                {item.details?.trim()
                                  ? item.details.trim()
                                  : 'No details added yet. Add product details in the database to show here.'}
                              </p>
                            </div>

                            <p className="mt-2 text-[10px] sm:text-[11px] text-white/45">Tap ✕ to close</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="text-center mt-10 lg:mt-14">
              <Link
                to="/products"
                className="group inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium shadow-[var(--shadow-warm)] hover:brightness-110 transition-all duration-300"
              >
                View All Products
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default HomeProducts;