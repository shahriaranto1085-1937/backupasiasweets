import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const navigate = useNavigate();
  // ✅ FIX: Destructure loginAsAdmin from useAuth at the top level
  const { user, isAdmin, loading: authLoading, loginAsAdmin } = useAuth();

  // Seed admin on first load
  useEffect(() => {
    const seedAdmin = async () => {
      setSeeding(true);
      try {
        await supabase.functions.invoke('seed-admin');
      } catch {
        // Ignore errors - admin may already exist
      }
      setSeeding(false);
    };
    seedAdmin();
  }, []);

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      navigate('/admin');
    }
  }, [user, isAdmin, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // ✅ FIX: Use loginAsAdmin from the hook called at the top level
      await loginAsAdmin(username, password);
      toast({ title: 'Welcome back!', description: 'Logged in successfully' });
      navigate('/admin');
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl">Admin Login</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to manage your store
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                disabled={loading || seeding}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                disabled={loading || seeding}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || seeding}>
              {seeding ? 'Setting up...' : loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
