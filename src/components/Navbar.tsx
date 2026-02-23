import { useEffect, useMemo, useState } from 'react';
import { Menu, X, Search, Facebook, Instagram, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

type NavbarProps = {
  showSearch?: boolean;
};

type MiniProduct = {
  id: string;
  name: string;
  price: number;
  image_url: string;
  categories?: { name: string } | null;
};

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
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isMiniOpen]);

  useEffect(() => {
    if (!isMiniOpen) return;
    const fetchMini = async () => {
      setMiniLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id,name,price,image_url,categories(name)')
        .order('created_at', { ascending: false })
        .limit(30);
      setMiniLoading(false);
      if (error) { setMiniProducts([]); return; }
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
    return miniProducts.filter((p) => {
      const c = (p.categories?.name || '').toLowerCase();
      return p.name.toLowerCase().includes(q) || c.includes(q);
    });
  }, [miniProducts, miniQuery]);

  const openMini = () => {
    setIsMiniOpen(true);
    setTimeout(() => {
      (document.getElementById('mini-search-input') as HTMLInputElement | null)?.focus();
    }, 50);
  };
  const closeMini = () => setIsMiniOpen(false);
  const goToAllProducts = () => {
    const q = miniQuery.trim();
    closeMini();
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-background/95 backdrop-blur-md shadow-soft' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center">
              <span className="font-display text-2xl font-bold text-primary">Asia Sweets</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                if (link.href.includes('#')) {
                  return (
                    <a key={link.name} href={link.href} onClick={(e) => {
                      e.preventDefault();
                      const hash = link.href.split('#')[1];
                      if (window.location.pathname !== '/') {
                        navigate('/', { state: { scrollTo: hash } });
                      } else {
                        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }} className="nav-link font-body text-base cursor-pointer">{link.name}</a>
                  );
                }
                return <Link key={link.name} to={link.href} className="nav-link font-body text-base">{link.name}</Link>;
              })}
            </div>

            <div className="hidden md:flex items-center gap-3">
              {showSearch && (
                <button onClick={openMini} className="p-2 rounded-full hover:bg-secondary transition-colors duration-200" aria-label="Search products">
                  <Search className="w-5 h-5 text-foreground/80" />
                </button>
              )}
              <Link to={user ? '/profile' : '/auth'} className="p-2 rounded-full hover:bg-secondary transition-colors duration-200" aria-label="Account">
                <User className="w-5 h-5 text-foreground/80" />
              </Link>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="icon-social" aria-label="Facebook"><Facebook className="w-4 h-4" /></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="icon-social" aria-label="Instagram"><Instagram className="w-4 h-4" /></a>
            </div>

            <div className="md:hidden flex items-center gap-2">
              {showSearch && (
                <button onClick={openMini} className="p-2 rounded-full hover:bg-secondary transition-colors" aria-label="Search products">
                  <Search className="w-5 h-5 text-foreground/80" />
                </button>
              )}
              <button className="p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle menu">
                {isMobileMenuOpen ? <X className="w-6 h-6 text-foreground" /> : <Menu className="w-6 h-6 text-foreground" />}
              </button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="md:hidden bg-background border-t border-border animate-fade-in">
              <div className="py-4 space-y-3">
                {navLinks.map((link) => {
                  if (link.href.includes('#')) {
                    return (
                      <a key={link.name} href={link.href} className="block px-4 py-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
                        onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); const hash = link.href.split('#')[1]; if (window.location.pathname !== '/') { navigate('/', { state: { scrollTo: hash } }); } else { document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }); } }}>
                        {link.name}
                      </a>
                    );
                  }
                  return <Link key={link.name} to={link.href} className="block px-4 py-2 text-foreground hover:bg-secondary rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(false)}>{link.name}</Link>;
                })}
                <Link to={user ? '/profile' : '/auth'} className="block px-4 py-2 text-foreground hover:bg-secondary rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  {user ? 'Profile' : 'Login'}
                </Link>
                <div className="flex items-center gap-4 px-4 pt-4 border-t border-border">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="icon-social" aria-label="Facebook"><Facebook className="w-4 h-4" /></a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="icon-social" aria-label="Instagram"><Instagram className="w-4 h-4" /></a>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {isMiniOpen && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={closeMini} />
          <div className="relative h-full w-full overflow-y-auto p-4 pt-24">
            <div className="mx-auto w-full max-w-3xl">
              <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input id="mini-search-input" value={miniQuery} onChange={(e) => setMiniQuery(e.target.value)} placeholder="Search sweets..." className="w-full h-11 rounded-full bg-background border border-border pl-9 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                      {miniQuery && (<button onClick={() => setMiniQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Clear search"><X className="w-4 h-4 text-muted-foreground" /></button>)}
                    </div>
                    <button onClick={closeMini} className="h-11 w-11 rounded-full border border-border hover:bg-secondary transition-colors flex items-center justify-center" aria-label="Close"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{miniLoading ? 'Loading...' : `${filteredMini.length} item${filteredMini.length !== 1 ? 's' : ''}`}</p>
                    <button onClick={goToAllProducts} className="text-sm font-medium text-primary hover:underline">View all products</button>
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  {miniLoading ? (
                    <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
                  ) : filteredMini.length === 0 ? (
                    <p className="text-center text-muted-foreground py-10">No products found.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                      {filteredMini.map((item) => (
                        <Link key={item.id} to={`/product/${item.id}`} onClick={closeMini} className="card-sweet group flex flex-col">
                          <div className="relative w-full h-20 sm:h-52 overflow-hidden rounded-xl">
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                          <div className="p-2.5 sm:p-5">
                            <span className="text-[10px] sm:text-xs text-primary font-medium uppercase tracking-wider truncate">{item.categories?.name || 'Uncategorized'}</span>
                            <div className="flex items-start justify-between gap-2 mt-1">
                              <h3 className="font-display text-sm sm:text-xl font-semibold text-foreground leading-tight line-clamp-2">{item.name}</h3>
                              <span className="whitespace-nowrap rounded-full bg-primary/10 text-primary px-2 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-sm font-extrabold tracking-tight">৳{Number(item.price).toFixed(0)}/kg</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-4 sm:p-5 border-t border-border flex justify-end">
                  <button onClick={goToAllProducts} className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 font-medium shadow-[var(--shadow-warm)] hover:brightness-110 transition-all">Browse all</button>
                </div>
              </div>
              <div className="h-10" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
