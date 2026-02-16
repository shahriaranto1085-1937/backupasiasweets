import { Routes, Route } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ProductsManager from '@/components/admin/ProductsManager';
import CategoriesManager from '@/components/admin/CategoriesManager';
import TicketsManager from '@/components/admin/TicketsManager';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DashboardHome = () => {
  const [stats, setStats] = useState({ products: 0, categories: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: pCount }, { count: cCount }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
      ]);
      setStats({ products: pCount || 0, categories: cCount || 0 });
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-display font-semibold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6"><p className="text-sm text-muted-foreground">Total Products</p><p className="text-3xl font-bold text-foreground mt-1">{stats.products}</p></div>
        <div className="bg-card border border-border rounded-xl p-6"><p className="text-sm text-muted-foreground">Total Categories</p><p className="text-3xl font-bold text-foreground mt-1">{stats.categories}</p></div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <Routes>
          <Route index element={<DashboardHome />} />
          <Route path="products" element={<ProductsManager />} />
          <Route path="categories" element={<CategoriesManager />} />
          <Route path="tickets" element={<TicketsManager />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;
