import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  created_at: string;
  product_count?: number;
}

const CategoriesManager = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Get product counts per category
    const { data: products } = await supabase.from('products').select('category_id');
    const counts: Record<string, number> = {};
    (products || []).forEach((p: any) => {
      counts[p.category_id] = (counts[p.category_id] || 0) + 1;
    });

    setCategories(
      ((data as any) || []).map((c: any) => ({
        ...c,
        product_count: counts[c.id] || 0,
      }))
    );
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    const { error } = await supabase.from('categories').insert({ name: newName.trim() });
    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Error', description: 'Category name already exists', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    } else {
      toast({ title: 'Created', description: 'Category added' });
      setNewName('');
      fetchCategories();
    }
    setAdding(false);
  };

  const handleDelete = async (cat: Category) => {
    if (cat.product_count && cat.product_count > 0) {
      toast({
        title: 'Cannot delete',
        description: `"${cat.name}" has ${cat.product_count} product(s). Remove them first.`,
        variant: 'destructive',
      });
      return;
    }
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', cat.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Category deleted' });
      fetchCategories();
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-display font-semibold mb-6">Categories</h2>

      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 mb-8">
        <Input
          placeholder="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 sm:max-w-sm"
          required
        />
        <Button type="submit" disabled={adding} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </form>

      {categories.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No categories yet.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Products</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-secondary/20">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 text-muted-foreground">{c.product_count}</td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {categories.map((c) => (
              <div key={c.id} className="border border-border rounded-xl bg-card p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.product_count} product{c.product_count !== 1 ? 's' : ''}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(c)}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CategoriesManager;
