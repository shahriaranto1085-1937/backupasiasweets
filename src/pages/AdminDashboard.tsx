import { Routes, Route, useNavigate } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ProductsManager from '@/components/admin/ProductsManager';
import CategoriesManager from '@/components/admin/CategoriesManager';
import TicketsManager from '@/components/admin/TicketsManager';
import ReviewsManager from '@/components/admin/ReviewsManager';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Package, FolderOpen, MessageSquare, Clock, Phone, ArrowRight, AlertCircle } from 'lucide-react';

const DashboardHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ products: 0, categories: 0, pendingTickets: 0 });
  const [pendingTickets, setPendingTickets] = useState<{ id: string; subject: string; phone_number?: string | null; created_at: string }[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: pCount }, { count: cCount }, { data: pending, count: tCount }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('support_tickets').select('id, subject, phone_number, created_at', { count: 'exact' }).eq('status', 'pending').order('created_at', { ascending: false }).limit(10),
      ]);
      setStats({ products: pCount || 0, categories: cCount || 0, pendingTickets: tCount || 0 });
      setPendingTickets(pending || []);
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'Total Products',
      value: stats.products,
      icon: Package,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      onClick: () => navigate('/admin/products'),
    },
    {
      label: 'Total Categories',
      value: stats.categories,
      icon: FolderOpen,
      iconBg: 'bg-golden/10',
      iconColor: 'text-golden-dark',
      onClick: () => navigate('/admin/categories'),
    },
    {
      label: 'Pending Tickets',
      value: stats.pendingTickets,
      icon: AlertCircle,
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
      highlight: stats.pendingTickets > 0,
      onClick: () => navigate('/admin/tickets'),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-display font-semibold">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Overview of your store</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              onClick={card.onClick}
              className={`group text-left bg-card border rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                card.highlight ? 'border-destructive/30 hover:border-destructive/50' : 'border-border hover:border-primary/40'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className={`text-3xl font-bold mt-1 ${card.highlight ? 'text-destructive' : 'text-foreground'}`}>
                {card.value}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
            </button>
          );
        })}
      </div>

      {/* Pending Tickets Section */}
      {pendingTickets.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-destructive" />
              </div>
              Pending Messages
            </h3>
            <button
              onClick={() => navigate('/admin/tickets')}
              className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-border">
            {pendingTickets.map(t => (
              <button
                key={t.id}
                onClick={() => navigate('/admin/tickets')}
                className="w-full text-left px-5 sm:px-6 py-4 hover:bg-secondary/40 transition-colors flex items-center gap-4"
              >
                <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{t.subject}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {t.phone_number && (
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <Phone className="w-3 h-3" />{t.phone_number}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {pendingTickets.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-foreground">All caught up!</h3>
          <p className="text-sm text-muted-foreground mt-1">No pending support tickets right now.</p>
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-4 pt-18 md:pt-6 md:p-6 lg:p-8 overflow-auto">
        <Routes>
          <Route index element={<DashboardHome />} />
          <Route path="products" element={<ProductsManager />} />
          <Route path="categories" element={<CategoriesManager />} />
          <Route path="tickets" element={<TicketsManager />} />
          <Route path="reviews" element={<ReviewsManager />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;
