import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';

type View = 'login' | 'signup' | 'forgot' | 'reset';

// NOTE: Keep this component outside of UserAuth.
const PasswordInput = ({
  value,
  onChange,
  placeholder,
  show,
  onToggle,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  show: boolean;
  onToggle: () => void;
}) => (
  <div className="relative">
    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    <Input
      type={show ? 'text' : 'password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="pl-9 pr-10"
      required
      minLength={6}
      autoComplete={show ? 'off' : 'current-password'}
    />
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  </div>
);

const UserAuth = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Detect Supabase recovery links (updates when URL changes)
  const isRecoveryFlow = useMemo(() => {
    const search = location.search || '';
    const hash = location.hash || '';

    // Supabase recovery links commonly include type=recovery in query OR hash.
    // We also allow our own forced view=reset query.
    return (
      search.includes('type=recovery') ||
      hash.includes('type=recovery') ||
      search.includes('view=reset')
    );
  }, [location.search, location.hash]);

  // ✅ Initial view
  const initialView = useMemo<View>(() => {
    if (isRecoveryFlow) return 'reset';
    const v = (searchParams.get('view') as View) || 'login';
    return ['login', 'signup', 'forgot', 'reset'].includes(v) ? v : 'login';
  }, [isRecoveryFlow, searchParams]);

  const [view, setView] = useState<View>(initialView);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ✅ Single source of truth for view:
  // - If recovery → always show reset
  // - else → use ?view=...
  useEffect(() => {
    if (isRecoveryFlow) {
      setView('reset');
      return;
    }

    const v = searchParams.get('view') as View;
    if (v && ['login', 'signup', 'forgot', 'reset'].includes(v)) {
      setView(v);
    } else {
      setView('login');
    }
  }, [searchParams, isRecoveryFlow]);

  // ✅ Also listen to Supabase auth event (extra-safe)
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setView('reset');
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // ✅ Only redirect logged-in users to profile if NOT in recovery/reset
  useEffect(() => {
    if (user && !isRecoveryFlow && view !== 'reset') {
      navigate('/profile');
    }
  }, [user, view, navigate, isRecoveryFlow]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    setLoading(false);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Welcome back!' });
      navigate('/');
    }

    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirmed` },
    });

    if (error) {
      toast({ title: 'Signup failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Check your email', description: 'We sent you a verification link.' });
      navigate('/auth?view=login', { replace: true });
    }

    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?view=reset`,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: 'Recovery email sent',
        description: 'Check your inbox for a password reset link.',
      });
    }

    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    toast({
      title: 'Password updated',
      description: 'You can now login with your new password.',
    });

    // Ensure we are not stuck in recovery session / view
    await supabase.auth.signOut();

    // Replace so user can't go back to recovery token page
    navigate('/auth?view=login', { replace: true });

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar showSearch={false} />
      <main className="pt-28 pb-16 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-warm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-display text-2xl">
              {view === 'login' && 'Sign In'}
              {view === 'signup' && 'Create Account'}
              {view === 'forgot' && 'Reset Password'}
              {view === 'reset' && 'Set New Password'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {view === 'login' && 'Sign in to your account'}
              {view === 'signup' && 'Join Asia Sweetmeat today'}
              {view === 'forgot' && "We'll send you a recovery link"}
              {view === 'reset' && 'Enter your new password'}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {(view === 'login' || view === 'signup') && (
              <>
                <Button
                  variant="outline"
                  className="w-full h-11 gap-2 font-medium"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>
              </>
            )}

            {view === 'login' && (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Password</Label>
                    <button
                      type="button"
                      onClick={() => navigate('/auth?view=forgot')}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    placeholder="••••••••"
                    show={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/auth?view=signup')}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              </form>
            )}

            {view === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    placeholder="Min 6 characters"
                    show={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Confirm password"
                    show={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/auth?view=login')}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            )}

            {view === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Recovery Link'}
                </Button>

                <button
                  type="button"
                  onClick={() => navigate('/auth?view=login')}
                  className="flex items-center gap-1 text-sm text-primary hover:underline mx-auto"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to login
                </button>
              </form>
            )}

            {view === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    placeholder="Min 6 characters"
                    show={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Confirm password"
                    show={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
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