import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, FolderOpen, LogOut, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const links = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/categories', icon: FolderOpen, label: 'Categories' },
  { to: '/admin/tickets', icon: MessageSquare, label: 'Support Tickets' },
];

const AdminSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => { await logout(); navigate('/admin/login'); };

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="font-display text-xl font-bold text-primary">Asia Sweets</h1>
        <p className="text-xs text-muted-foreground mt-1">Admin Panel</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'}`}>
            <Icon className="w-4 h-4" />{label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"><LogOut className="w-4 h-4" />Logout</button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
