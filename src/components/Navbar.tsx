import { useEffect, useMemo, useState } from 'react';
import { Menu, X, Search, User, ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

type NavbarProps = { showSearch?: boolean };
type MiniProduct = { id: string; name: string; price: number; image_url: string; categories?: { name: string } | null };

const Navbar = ({ showSearch = true }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMiniOpen, setIsMiniOpen] = useState(false);
  const [miniQuery, setMiniQuery] = useState('');
  const [miniLoading, setMiniLoading] = useState(false);
  const [miniProducts, setMiniProducts] = useState<MiniProduct[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isMiniOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isMiniOpen]);

  useEffect(() => {
    if (!isMiniOpen) return;
    const fetchMini = async () => {
      setMiniLoading(true);
      const { data } = await supabase.from('products').select('id,name,price,image_url,categories(name)').order('created_at', { ascending: false }).limit(30);
      setMiniLoading(false);
      setMiniProducts((data as any) || []);
    };
    fetchMini();
  }, [isMiniOpen]);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/#about' },
    { name: 'Products', href: '/products' },
  ];

  const filteredMini = useMemo(() => {
    const q = miniQuery.trim().toLowerCase();
    if (!q) return miniProducts;
    return miniProducts.filter(p => p.name.toLowerCase().includes(q) || (p.categories?.name || '').toLowerCase().includes(q));
  }, [miniProducts, miniQuery]);

  const openMini = () => { setIsMiniOpen(true); setTimeout(() => (document.getElementById('mini-search-input') as HTMLInputElement)?.focus(), 50); };
  const closeMini = () => setIsMiniOpen(false);
  const goToAllProducts = () => { closeMini(); navigate(miniQuery.trim() ? `/products?q=${encodeURIComponent(miniQuery.trim())}` : '/products'); };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-card/95 backdrop-blur-md shadow-md' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-2xl font-bold text-foreground">Asia <span className="text-primary">Sweets</span></span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => {
                if (link.href.includes('#')) {
                  return (
                    <a key={link.name} href={link.href} onClick={e => {
                      e.preventDefault();
                      const hash = link.href.split('#')[1];
                      if (window.location.pathname !== '/') navigate('/', { state: { scrollTo: hash } });
                      else document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
                    }} className="px-4 py-2 rounded-xl text-sm font-semibold text-foreground/70 hover:text-foreground hover:bg-primary/10 transition-all cursor-pointer">{link.name}</a>
                  );
                }
                return <Link key={link.name} to={link.href} className="px-4 py-2 rounded-xl text-sm font-semibold text-foreground/70 hover:text-foreground hover:bg-primary/10 transition-all">{link.name}</Link>;
              })}
            </div>

            <div className="hidden md:flex items-center gap-2">
              {showSearch && (
                <button onClick={openMini} className="p-2.5 rounded-xl hover:bg-primary/10 transition-colors" aria-label="Search">
                  <Search className="w-5 h-5 text-foreground/70" />
                </button>
              )}
              <Link to={user ? '/profile' : '/auth'} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all shadow-sm">
                <User className="w-4 h-4" />
                {user ? 'Profile' : 'Sign In'}
              </Link>
            </div>

            <div className="md:hidden flex items-center gap-2">
              {showSearch && (
                <button onClick={openMini} className="p-2 rounded-xl hover:bg-primary/10 transition-colors" aria-label="Search">
                  <Search className="w-5 h-5 text-foreground/70" />
                </button>
              )}
              <button className="p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle menu">
                {isMobileMenuOpen ? <X className="w-6 h-6 text-foreground" /> : <Menu className="w-6 h-6 text-foreground" />}
              </button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="md:hidden bg-card border-t border-border rounded-b-2xl shadow-lg">
              <div className="py-4 space-y-1 px-2">
                {navLinks.map(link => {
                  if (link.href.includes('#')) {
                    return (
                      <a key={link.name} href={link.href} className="block px-4 py-3 text-foreground font-semibold hover:bg-primary/10 rounded-xl transition-colors"
                        onClick={e => { e.preventDefault(); setIsMobileMenuOpen(false); const hash = link.href.split('#')[1]; if (window.location.pathname !== '/') navigate('/', { state: { scrollTo: hash } }); else document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }); }}>
                        {link.name}
                      </a>
                    );
                  }
                  return <Link key={link.name} to={link.href} className="block px-4 py-3 text-foreground font-semibold hover:bg-primary/10 rounded-xl transition-colors" onClick={() => setIsMobileMenuOpen(false)}>{link.name}</Link>;
                })}
                <Link to={user ? '/profile' : '/auth'} className="block px-4 py-3 text-primary font-bold hover:bg-primary/10 rounded-xl transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  {user ? '👤 Profile' : '✨ Sign In'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {isMiniOpen && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={closeMini} />
          <div className="relative h-full w-full overflow-y-auto p-4 pt-24">
            <div className="mx-auto w-full max-w-3xl">
              <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden bounce-in">
                <div className="p-5 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input id="mini-search-input" value={miniQuery} onChange={e => setMiniQuery(e.target.value)} placeholder="Search yummy sweets... 🍬" className="w-full h-12 rounded-2xl bg-muted/50 border-none pl-12 pr-10 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30" />
                      {miniQuery && <button onClick={() => setMiniQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-muted-foreground" /></button>}
                    </div>
                    <button onClick={closeMini} className="h-12 w-12 rounded-2xl border border-border hover:bg-primary/10 transition-colors flex items-center justify-center"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground font-medium">{miniLoading ? 'Loading...' : `${filteredMini.length} item${filteredMini.length !== 1 ? 's' : ''}`}</p>
                    <button onClick={goToAllProducts} className="text-sm font-bold text-primary hover:underline">View all →</button>
                  </div>
                </div>
                <div className="p-5">
                  {miniLoading ? (
                    <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
                  ) : filteredMini.length === 0 ? (
                    <p className="text-center text-muted-foreground py-10">No sweets found 😢</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {filteredMini.map(item => (
                        <Link key={item.id} to={`/product/${item.id}`} onClick={closeMini} className="group bg-muted/30 rounded-2xl overflow-hidden hover:shadow-md transition-all hover:-translate-y-1">
                          <div className="relative w-full h-20 sm:h-40 overflow-hidden">
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                          <div className="p-2 sm:p-3">
                            <span className="text-[10px] sm:text-xs text-secondary font-bold uppercase tracking-wider">{item.categories?.name || 'Sweet'}</span>
                            <h3 className="font-display text-xs sm:text-base font-semibold text-foreground mt-0.5 line-clamp-1">{item.name}</h3>
                            <span className="text-primary font-extrabold text-xs sm:text-sm">৳{Number(item.price).toFixed(0)}/kg</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-5 border-t border-border flex justify-end">
                  <button onClick={goToAllProducts} className="inline-flex items-center justify-center rounded-2xl bg-primary text-primary-foreground px-6 py-3 font-bold shadow-md hover:brightness-110 transition-all">Browse All 🍰</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
