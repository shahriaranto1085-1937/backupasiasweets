import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Search, X, ChevronDown, Sparkles, Star, MoreVertical } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

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

type SortOption = 'newest' | 'oldest' | 'price_low' | 'price_high' | 'name_asc' | 'name_desc';

const sortLabels: Record<SortOption, string> = {
  newest: 'Newest First',
  oldest: 'Oldest First',
  price_low: 'Price: Low to High',
  price_high: 'Price: High to Low',
  name_asc: 'Name: A–Z',
  name_desc: 'Name: Z–A',
};

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

const ProductSearch = () => {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const [showSort, setShowSort] = useState(false);
  const [reviewMap, setReviewMap] = useState<Record<string, ReviewSummary>>({});

  // ✅ dots/details state
  const [openId, setOpenId] = useState<string | null>(null);
  const closeDetails = () => setOpenId(null);
  const panelRef = useCloseHandlers(!!openId, closeDetails);

  const [params] = useSearchParams();
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Fixed bar refs + sizes
  const barRef = useRef<HTMLDivElement | null>(null);
  const [barTop, setBarTop] = useState(0);
  const [barHeight, setBarHeight] = useState(0);
  const spacerHeight = useMemo(() => barTop + barHeight, [barTop, barHeight]);

  useEffect(() => {
    const q = params.get('q');
    if (q) {
      setSearch(q);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [params]);

  // Close popovers when clicking outside the fixed bar area
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!barRef.current) return;
      if (!barRef.current.contains(e.target as Node)) {
        setShowSort(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // Track bar height so spacer always correct
  useLayoutEffect(() => {
    if (!barRef.current) return;

    const update = () => setBarHeight(barRef.current?.offsetHeight || 0);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(barRef.current);
    return () => ro.disconnect();
  }, []);

  // Dynamic "top" so bar stays BELOW navbar while navbar is visible
  useEffect(() => {
    let raf = 0;

    const findNav = () => {
      return (
        document.querySelector('header') ||
        document.querySelector('nav') ||
        document.getElementById('navbar') ||
        document.querySelector('[data-navbar]')
      ) as HTMLElement | null;
    };

    const updateTop = () => {
      const navEl = findNav();
      if (!navEl) {
        setBarTop(0);
        return;
      }

      const rect = navEl.getBoundingClientRect();
      const nextTop = rect.bottom > 0 ? Math.round(rect.bottom) : 0;
      setBarTop(nextTop);
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateTop);
    };

    updateTop();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // ✅ NO LIMIT: fetch all products
      const [{ data: pData, error: pErr }, { data: cData, error: cErr }, { data: rData, error: rErr }] =
        await Promise.all([
          supabase.from('products').select('id,name,price,image_url,details,created_at,categories(name)').order('created_at', { ascending: false }),
          supabase.from('categories').select('*').order('name'),
          supabase.from('reviews').select('product_id, rating'),
        ]);

      if (pErr) console.error(pErr);
      if (cErr) console.error(cErr);
      if (rErr) console.error(rErr);

      const prods = ((pData as any) || []) as Product[];
      setProducts(prods);
      setCategories((cData as any) || []);

      // review summaries
      const map: Record<string, { total: number; count: number }> = {};
      ((rData as any) || []).forEach((r: { product_id: string; rating: number }) => {
        if (!map[r.product_id]) map[r.product_id] = { total: 0, count: 0 };
        map[r.product_id].total += Number(r.rating);
        map[r.product_id].count += 1;
      });

      const summaries: Record<string, ReviewSummary> = {};
      Object.entries(map).forEach(([pid, { total, count }]) => {
        summaries[pid] = { product_id: pid, avg: count ? parseFloat((total / count).toFixed(1)) : 0, count };
      });
      setReviewMap(summaries);

      setLoading(false);
    };

    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return products
      .filter((p) => {
        if (search) {
          const q = search.toLowerCase();
          if (!p.name.toLowerCase().includes(q) && !(p.categories?.name || '').toLowerCase().includes(q)) return false;
        }
        if (selectedCategory !== 'all' && (p.categories?.name || '') !== selectedCategory) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price_low':
            return Number(a.price) - Number(b.price);
          case 'price_high':
            return Number(b.price) - Number(a.price);
          case 'name_asc':
            return a.name.localeCompare(b.name);
          case 'name_desc':
            return b.name.localeCompare(a.name);
          case 'oldest':
            return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
          case 'newest':
          default:
            return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        }
      });
  }, [products, search, selectedCategory, sortBy]);

  return (
    <section id="products" className="pt-2 sm:pt-4 pb-16 lg:pb-24 bg-secondary/30">
      {/* ✅ Fixed bar (search + sort only) */}
      <div
        ref={barRef}
        // Keep this ABOVE any product-card overlays/buttons
        className="fixed left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border"
        style={{ top: barTop }}
      >
        <div className="container mx-auto px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex items-stretch sm:items-center gap-3 max-w-3xl mx-auto">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Search by name or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-9 h-11 sm:h-12 rounded-full border-border shadow-soft text-xs sm:text-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative w-[135px] sm:w-[170px] shrink-0">
              <button
                type="button"
                onClick={() => setShowSort(!showSort)}
                className={`inline-flex w-full items-center justify-center gap-1.5 px-3 sm:px-5 h-11 sm:h-12 rounded-full border font-medium text-[11px] sm:text-sm transition-all duration-200 ${
                  showSort
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-foreground hover:border-primary'
                }`}
              >
                <span className="leading-none">Sort</span>
                <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${showSort ? 'rotate-180' : ''}`} />
              </button>

              {showSort && (
                <div className="absolute right-0 top-12 sm:top-14 z-50 bg-card border border-border rounded-xl shadow-lg py-2 min-w-[200px] animate-fade-in">
                  {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSortBy(key);
                        setShowSort(false);
                      }}
                      className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        sortBy === key ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-secondary'
                      }`}
                    >
                      {sortLabels[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Spacer: pushes page content below navbar + fasdsdasdixed bar */}
      <div style={{ height: spacerHeight }} />

      <div className="container mx-auto px-4 lg:px-8">
        {/* Header (scrolls away) */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 text-primary font-medium text-sm uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Our Collection
          </span>
          <h2 className="section-title mt-2">Sweet Menu</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Discover our handcrafted selection of traditional Asian sweets.
          </p>
        </div>

        {/* Category selector */}
        <div className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-foreground hover:border-primary'
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.name)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  selectedCategory === c.name
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-foreground hover:border-primary'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            {search || selectedCategory !== 'all' ? 'No products match your criteria.' : 'No products available yet.'}
          </p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {filtered.map((item) => {
              const rev = reviewMap[item.id];
              const isOpen = openId === item.id;

              return (
                <div key={item.id} className="relative">
                  {/* Card (dot button is INSIDE so it never overlaps outside the card in mobile) */}
                  <Link
                    to={`/product/${item.id}`}
                    className="group relative block rounded-2xl overflow-hidden aspect-[3/3.5] sm:aspect-[3/3.5]"
                    onClick={(e) => {
                      // When details are open, do NOT navigate
                      if (isOpen) e.preventDefault();
                    }}
                  >
                    <img
                      src={item.image_url}
                      alt={item.name}
                      loading="lazy"
                      className={[
                        'absolute inset-0 w-full h-full object-cover transition-all duration-700',
                        'group-hover:scale-110',
                        isOpen ? 'scale-105 blur-[6px] brightness-75' : '',
                      ].join(' ')}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5" />

                    {/* Category pill */}
                    <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10">
                      <span className="bg-white/90 backdrop-blur-sm text-foreground text-[9px] sm:text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
                        {item.categories?.name || 'Uncategorized'}
                      </span>
                    </div>

                    {/* Bottom info (hide when open to look clean) */}
                    <div
                      className={[
                        'absolute bottom-0 left-0 right-0 p-3 sm:p-5 z-10 transition-all duration-500',
                        isOpen ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0',
                      ].join(' ')}
                    >
                      <h3 className="font-display text-sm sm:text-lg font-bold text-white leading-snug line-clamp-2 drop-shadow-lg">
                        {item.name}
                      </h3>

                      <div className="flex items-center justify-between mt-1.5 sm:mt-2">
                        <span className="bg-primary text-primary-foreground text-[11px] sm:text-sm font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">
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
                      <div ref={panelRef} className="w-full rounded-2xl border border-white/15 bg-black/40 backdrop-blur-xl shadow-2xl">
                        <div className="px-4 pt-4 pb-2">
                          <p className="text-white font-semibold leading-tight line-clamp-1 text-sm sm:text-base">{item.name}</p>
                          <div className="mt-1 flex items-center gap-2 text-[11px] sm:text-xs text-white/70">
                            <span className="uppercase tracking-wider">{item.categories?.name || 'Uncategorized'}</span>
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
        )}
      </div>
    </section>
  );
};

export default ProductSearch;