import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search, X, ChevronDown, SlidersHorizontal } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

interface Category { id: string; name: string; }

interface Product {
  id: string; name: string; category_id: string; price: number;
  details: string; image_url: string; created_at: string;
  categories?: { name: string } | null;
}

type SortOption = 'newest' | 'price_low' | 'price_high' | 'name_asc';
const sortLabels: Record<SortOption, string> = {
  newest: 'Newest First',
  price_low: 'Price: Low → High',
  price_high: 'Price: High → Low',
  name_asc: 'Name: A–Z',
};

const ProductsManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showSort, setShowSort] = useState(false);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [details, setDetails] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else setProducts((data as any) || []);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories((data as any) || []);
  };

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  const resetForm = () => { setName(''); setCategoryId(''); setPrice(''); setDetails(''); setImageFile(null); setEditingProduct(null); };

  const openEdit = (product: Product) => {
    setEditingProduct(product); setName(product.name); setCategoryId(product.category_id);
    setPrice(String(product.price)); setDetails(product.details); setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId || !price || !details.trim()) { toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' }); return; }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) { toast({ title: 'Error', description: 'Price must be a positive number', variant: 'destructive' }); return; }
    setSubmitting(true);
    try {
      let imageUrl = editingProduct?.image_url || '';
      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }
      if (!imageUrl && !editingProduct) { toast({ title: 'Error', description: 'Please upload an image', variant: 'destructive' }); setSubmitting(false); return; }
      if (editingProduct) {
        const updateData: any = { name: name.trim(), category_id: categoryId, price: priceNum, details: details.trim() };
        if (imageUrl) updateData.image_url = imageUrl;
        const { error } = await supabase.from('products').update(updateData).eq('id', editingProduct.id);
        if (error) throw error;
        toast({ title: 'Updated', description: 'Product updated successfully' });
      } else {
        const { error } = await supabase.from('products').insert({ name: name.trim(), category_id: categoryId, price: priceNum, details: details.trim(), image_url: imageUrl });
        if (error) throw error;
        toast({ title: 'Created', description: 'Product added successfully' });
      }
      setDialogOpen(false); resetForm(); fetchProducts();
    } catch (error: any) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Deleted', description: 'Product deleted' }); fetchProducts(); }
  };

  const filtered = useMemo(() => {
    return products
      .filter((p) => {
        const q = search.toLowerCase();
        const matchesSearch = !q || p.name.toLowerCase().includes(q) || (p.categories?.name || '').toLowerCase().includes(q);
        const matchesCategory = filterCategory === 'all' || (p.categories?.name || '') === filterCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price_low': return Number(a.price) - Number(b.price);
          case 'price_high': return Number(b.price) - Number(a.price);
          case 'name_asc': return a.name.localeCompare(b.name);
          default: return 0; // newest is default order from DB
        }
      });
  }, [products, search, filterCategory, sortBy]);

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-display font-semibold">Products</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" /> Add</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>Price (৳) *</Label><Input type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Details *</Label><textarea value={details} onChange={(e) => setDetails(e.target.value)} required rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <div className="space-y-2"><Label>Image {editingProduct ? '(optional)' : '*'}</Label><Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} /></div>
              <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Saving...' : editingProduct ? 'Update' : 'Add Product'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + Filter + Sort bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-8" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-muted-foreground" /></button>}
        </div>

        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm min-w-[140px]"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSort(!showSort)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-input bg-background text-sm font-medium whitespace-nowrap"
          >
            {sortLabels[sortBy]}
            <ChevronDown className={`w-4 h-4 transition-transform ${showSort ? 'rotate-180' : ''}`} />
          </button>
          {showSort && (
            <div className="absolute right-0 top-12 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[180px]">
              {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                <button
                  key={key}
                  onClick={() => { setSortBy(key); setShowSort(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm transition-colors ${sortBy === key ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-secondary'}`}
                >
                  {sortLabels[key]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-3">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</p>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No products found.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-3 font-medium">Image</th>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-left p-3 font-medium">Price</th>
                  <th className="text-left p-3 font-medium">Details</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-secondary/20">
                    <td className="p-3">
                      <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover" loading="lazy" />
                    </td>
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 text-muted-foreground">{p.categories?.name || '—'}</td>
                    <td className="p-3">৳{Number(p.price).toFixed(0)}</td>
                    <td className="p-3 text-muted-foreground max-w-xs truncate">{p.details}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((p) => (
              <div key={p.id} className="border border-border rounded-xl bg-card p-3 flex gap-3">
                <img src={p.image_url} alt={p.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.categories?.name || '—'}</p>
                  <p className="text-sm font-bold text-primary mt-0.5">৳{Number(p.price).toFixed(0)}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(p.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProductsManager;
