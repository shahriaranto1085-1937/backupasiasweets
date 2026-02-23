import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Search, X, SlidersHorizontal, ChevronDown, Sparkles } from 'lucide-react';

interface Category { id: string; name: string; }
interface Product { id: string; name: string; price: number; image_url: string; description: string; categories?: { name: string } | null; }

type SortOption = 'newest' | 'oldest' | 'price_low' | 'price_high' | 'name_asc' | 'name_desc';
const sortLabels: Record<SortOption, string> = {
  newest: 'Newest First', oldest: 'Oldest First', price_low: 'Price: Low to High',
  price_high: 'Price: High to Low', name_asc: 'Name: A–Z', name_desc: 'Name: Z–A',
};

const ProductSearch = () => {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [params] = useSearchParams();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const q = params.get('q');
    if (q) { setSearch(q); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [params]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [{ data: pData }, { data: cData }] = await Promise.all([
        supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
      ]);
      const prods = (pData as any) || [];
      setProducts(prods);
      setCategories((cData as any) || []);
      if (prods.length > 0) {
        const mp = Math.ceil(Math.max(...prods.map((p: Product) => Number(p.price))));
        setMaxPrice(mp);
        setPriceRange([0, mp]);
      }
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
        const price = Number(p.price);
        if (price < priceRange[0] || price > priceRange[1]) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price_low': return Number(a.price) - Number(b.price);
          case 'price_high': return Number(b.price) - Number(a.price);
          case 'name_asc': return a.name.localeCompare(b.name);
          case 'name_desc': return b.name.localeCompare(a.name);
          default: return 0;
        }
      });
  }, [products, search, selectedCategory, priceRange, sortBy]);

  const activeFilterCount = (selectedCategory !== 'all' ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0);

  return (
    <section id="products" className="py-16 lg:py-24 bg-secondary/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 text-primary font-medium text-sm uppercase tracking-wider"><Sparkles className="w-4 h-4" /> Our Collection</span>
          <h2 className="section-title mt-2">Sweet Menu</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">Discover our handcrafted selection of traditional Asian sweets.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-3xl mx-auto mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input ref={inputRef} placeholder="Search by name or category..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-12 pr-10 h-12 rounded-full border-border shadow-soft" />
            {search && (<button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2"><X className="w-5 h-5 text-muted-foreground" /></button>)}
          </div>
          <button onClick={() => { setShowFilters(!showFilters); setShowSort(false); }} className={`inline-flex items-center gap-2 px-5 h-12 rounded-full border font-medium text-sm transition-all duration-200 ${showFilters ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground hover:border-primary'}`}>
            <SlidersHorizontal className="w-4 h-4" /> Filters
            {activeFilterCount > 0 && <span className="bg-primary-foreground text-primary text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{activeFilterCount}</span>}
          </button>
          <div className="relative">
            <button onClick={() => { setShowSort(!showSort); setShowFilters(false); }} className={`inline-flex items-center gap-2 px-5 h-12 rounded-full border font-medium text-sm transition-all duration-200 whitespace-nowrap ${showSort ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground hover:border-primary'}`}>
              Sort <ChevronDown className={`w-4 h-4 transition-transform ${showSort ? 'rotate-180' : ''}`} />
            </button>
            {showSort && (
              <div className="absolute right-0 top-14 z-20 bg-card border border-border rounded-xl shadow-lg py-2 min-w-[200px] animate-fade-in">
                {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                  <button key={key} onClick={() => { setSortBy(key); setShowSort(false); }} className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${sortBy === key ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-secondary'}`}>{sortLabels[key]}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="max-w-3xl mx-auto mb-8 bg-card border border-border rounded-2xl p-6 shadow-soft animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setSelectedCategory('all')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-primary/20'}`}>All</button>
                  {categories.map((c) => (
                    <button key={c.id} onClick={() => setSelectedCategory(c.name)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === c.name ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-primary/20'}`}>{c.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Price Range: ৳{priceRange[0]} – ৳{priceRange[1]}</label>
                <div className="flex items-center gap-3">
                  <Input type="number" min={0} max={priceRange[1]} value={priceRange[0]} onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])} className="h-9 w-24" placeholder="Min" />
                  <span className="text-muted-foreground">—</span>
                  <Input type="number" min={priceRange[0]} max={maxPrice} value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])} className="h-9 w-24" placeholder="Max" />
                </div>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button onClick={() => { setSelectedCategory('all'); setPriceRange([0, maxPrice]); }} className="mt-4 text-sm text-primary font-medium hover:underline">Clear all filters</button>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">{search || activeFilterCount > 0 ? 'No products match your criteria.' : 'No products available yet.'}</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{filtered.length} product{filtered.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {filtered.map((item) => (
                <Link key={item.id} to={`/product/${item.id}`} className="card-sweet group flex flex-col">
                  <div className="relative w-full h-24 sm:h-52 overflow-hidden rounded-xl">
                    <img src={item.image_url} alt={item.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-2.5 sm:p-5 flex flex-col justify-center">
                    <span className="text-[10px] sm:text-xs text-primary font-medium uppercase tracking-wider truncate">{item.categories?.name || 'Uncategorized'}</span>
                    <div className="flex items-start justify-between gap-2 mt-1">
                      <h3 className="font-display text-sm sm:text-xl font-semibold text-foreground leading-tight">{item.name}</h3>
                      <span className="text-primary font-bold whitespace-nowrap text-xs sm:text-base">৳{Number(item.price).toFixed(0)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default ProductSearch;
