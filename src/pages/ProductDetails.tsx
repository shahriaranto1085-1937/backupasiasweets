import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SupportTicketWidget from '@/components/SupportTicketWidget';
import { ArrowLeft } from 'lucide-react';

interface Product {
  id: string; name: string; category_id: string; price: number;
  description: string; image_url: string; categories?: { name: string } | null;
}

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data } = await supabase.from('products').select('*, categories(name)').eq('id', id!).maybeSingle();
      if (data) {
        setProduct(data as any);
        const { data: sameCat } = await supabase.from('products').select('*, categories(name)').eq('category_id', (data as any).category_id).neq('id', id!).limit(8);
        let items = (sameCat as any) || [];
        if (items.length < 6) {
          const existingIds = [id!, ...items.map((i: any) => i.id)];
          const { data: more } = await supabase.from('products').select('*, categories(name)').not('id', 'in', `(${existingIds.join(',')})`).order('created_at', { ascending: false }).limit(8 - items.length);
          items = [...items, ...((more as any) || [])];
        }
        setRelated(items.slice(0, 8));
      }
      setLoading(false);
    };
    if (id) fetchProduct();
  }, [id]);

  if (loading) return (<div className="min-h-screen bg-background"><Navbar /><div className="flex items-center justify-center py-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></div>);
  if (!product) return (<div className="min-h-screen bg-background"><Navbar /><div className="container mx-auto px-4 py-32 text-center"><h1 className="text-2xl font-display font-semibold">Product not found</h1><Link to="/" className="text-primary mt-4 inline-block hover:underline">← Back to home</Link></div></div>);

  return (
    <div className="min-h-screen bg-background">
      <Navbar showSearch={false} />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <Link to="/products" className="inline-flex items-center gap-2 text-primary hover:underline mb-8"><ArrowLeft className="w-4 h-4" /> Back to products</Link>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="rounded-2xl overflow-hidden shadow-warm"><img src={product.image_url} alt={product.name} loading="eager" className="w-full aspect-square object-cover" /></div>
            <div className="flex flex-col justify-center space-y-6">
              <span className="text-sm text-primary font-medium uppercase tracking-wider">{product.categories?.name || 'Uncategorized'}</span>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">{product.name}</h1>
              <p className="text-3xl font-bold text-primary">৳{Number(product.price).toFixed(0)}</p>
              <div className="text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</div>
            </div>
          </div>
          {related.length > 0 && (
            <section className="mt-16 lg:mt-24">
              <h2 className="text-2xl md:text-3xl font-display font-semibold mb-8">Explore Other Products</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                {related.map((item) => (
                  <Link key={item.id} to={`/product/${item.id}`} className="card-sweet group">
                    <div className="aspect-square overflow-hidden"><img src={item.image_url} alt={item.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>
                    <div className="p-4">
                      <span className="text-xs text-primary font-medium uppercase">{item.categories?.name}</span>
                      <h3 className="font-display text-lg font-semibold text-foreground mt-1 truncate">{item.name}</h3>
                      <p className="text-primary font-bold mt-1">৳{Number(item.price).toFixed(0)}</p>
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
