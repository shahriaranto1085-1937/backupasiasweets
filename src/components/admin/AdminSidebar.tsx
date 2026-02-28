import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Package, FolderOpen, LogOut, MessageSquare, Menu, X, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import logo from '@/assets/logo.png';

const links = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/categories', icon: FolderOpen, label: 'Categories' },
  { to: '/admin/tickets', icon: MessageSquare, label: 'Support Tickets' },
  { to: '/admin/reviews', icon: Search, label: 'Khoj the Search' },
];

const AdminSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navContent = (
    <>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-secondary'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 min-h-screen bg-card border-r border-border flex-col">
        <Link to="/" className="p-6 border-b border-border flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src={logo} alt="Asia Sweetmeat" className="w-8 h-8 rounded-full object-cover" />
          <div>
            <h1 className="font-display text-xl font-bold text-primary">Asia Sweetmeat</h1>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </Link>
        {navContent}
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border flex items-center justify-between px-4 h-14">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={logo} alt="Asia Sweetmeat" className="w-7 h-7 rounded-full object-cover" />
          <h1 className="font-display text-lg font-bold text-primary">Asia Sweetmeat</h1>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="md:hidden fixed top-14 left-0 bottom-0 z-50 w-64 bg-card border-r border-border flex flex-col animate-fade-in">
            {navContent}
          </aside>
        </>
      )}
    </>
  );
};

export default AdminSidebar;
