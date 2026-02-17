import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff, ShoppingBag } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';

type View = 'login' | 'signup' | 'forgot' | 'reset';

const PasswordInput = ({ value, onChange, placeholder, show, onToggle }: { value: string; onChange: (v: string) => void; placeholder: string; show: boolean; onToggle: () => void }) => (
  <div className="relative">
    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    <Input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="pl-9 pr-10 rounded-xl" required minLength={6} autoComplete={show ? 'off' : 'current-password'} />
    <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={show ? 'Hide password' : 'Show password'}>
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  </div>
);

const UserAuth = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialView = (searchParams.get('view') as View) || 'login';
  const [view, setView] = useState<View>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate('/profile'); }, [user, navigate]);
  useEffect(() => {
    const v = searchParams.get('view') as View;
    if (v && ['login', 'signup', 'forgot', 'reset'].includes(v)) setView(v);
  }, [searchParams]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Welcome back! 🎉' }); navigate('/'); }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast({ title: 'Passwords do not match', variant: 'destructive' }); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin } });
    if (error) toast({ title: 'Signup failed', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Check your email ✉️', description: 'We sent you a verification link.' }); setView('login'); }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth?view=reset` });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else toast({ title: 'Recovery email sent 📬', description: 'Check your inbox for a password reset link.' });
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast({ title: 'Passwords do not match', variant: 'destructive' }); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Password updated! 🔒' }); navigate('/'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-20 -left-20 w-72 h-72 bg-primary/10 blob-shape float-animation" />
      <div className="absolute bottom-20 right-0 w-56 h-56 bg-secondary/10 blob-shape float-animation" style={{ animationDelay: '1s' }} />

      <Navbar showSearch={false} />
      <main className="pt-28 pb-16 flex items-center justify-center px-4 relative z-10">
        <Card className="w-full max-w-md shadow-xl border-border/50 rounded-3xl bounce-in">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-7 h-7 text-primary" />
            </div>
            <CardTitle className="font-display text-2xl">
              {view === 'login' && 'Welcome Back! 👋'}{view === 'signup' && 'Join Us! ✨'}{view === 'forgot' && 'Reset Password 🔑'}{view === 'reset' && 'New Password 🔒'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {view === 'login' && 'Sign in to your account'}{view === 'signup' && 'Create your Asia Sweets account'}{view === 'forgot' && "We'll send you a recovery link"}{view === 'reset' && 'Enter your new password'}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {view === 'login' && (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2"><Label>Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="pl-9 rounded-xl" required /></div></div>
                <div className="space-y-2"><div className="flex justify-between"><Label>Password</Label><button type="button" onClick={() => setView('forgot')} className="text-xs text-primary font-bold hover:underline">Forgot password?</button></div><PasswordInput value={password} onChange={setPassword} placeholder="••••••••" show={showPassword} onToggle={() => setShowPassword(!showPassword)} /></div>
                <Button type="submit" className="w-full rounded-xl font-bold" disabled={loading}>{loading ? 'Signing in...' : 'Sign In 🚀'}</Button>
                <p className="text-center text-sm text-muted-foreground">Don't have an account?{' '}<button type="button" onClick={() => setView('signup')} className="text-primary font-bold hover:underline">Sign up</button></p>
              </form>
            )}

            {view === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2"><Label>Full Name</Label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" className="pl-9 rounded-xl" required /></div></div>
                <div className="space-y-2"><Label>Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="pl-9 rounded-xl" required /></div></div>
                <div className="space-y-2"><Label>Password</Label><PasswordInput value={password} onChange={setPassword} placeholder="Min 6 characters" show={showPassword} onToggle={() => setShowPassword(!showPassword)} /></div>
                <div className="space-y-2"><Label>Confirm Password</Label><PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm password" show={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />{confirmPassword && password !== confirmPassword && <p className="text-xs text-destructive font-medium">Passwords do not match</p>}</div>
                <Button type="submit" className="w-full rounded-xl font-bold" disabled={loading}>{loading ? 'Creating account...' : 'Create Account ✨'}</Button>
                <p className="text-center text-sm text-muted-foreground">Already have an account?{' '}<button type="button" onClick={() => setView('login')} className="text-primary font-bold hover:underline">Sign in</button></p>
              </form>
            )}

            {view === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2"><Label>Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="pl-9 rounded-xl" required /></div></div>
                <Button type="submit" className="w-full rounded-xl font-bold" disabled={loading}>{loading ? 'Sending...' : 'Send Recovery Link 📬'}</Button>
                <button type="button" onClick={() => setView('login')} className="flex items-center gap-1 text-sm text-primary font-bold hover:underline mx-auto"><ArrowLeft className="w-3 h-3" /> Back to login</button>
              </form>
            )}

            {view === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2"><Label>New Password</Label><PasswordInput value={password} onChange={setPassword} placeholder="Min 6 characters" show={showPassword} onToggle={() => setShowPassword(!showPassword)} /></div>
                <div className="space-y-2"><Label>Confirm New Password</Label><PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm password" show={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />{confirmPassword && password !== confirmPassword && <p className="text-xs text-destructive font-medium">Passwords do not match</p>}</div>
                <Button type="submit" className="w-full rounded-xl font-bold" disabled={loading}>{loading ? 'Updating...' : 'Update Password 🔒'}</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default UserAuth;
