import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

const AuthConfirmed = () => {
  // Email confirmation links may create a session automatically.
  // User requested: show a confirmation message + login link (not profile),
  // so we sign out here to force a clean login.
  useEffect(() => {
    supabase.auth.signOut();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar showSearch={false} />
      <main className="pt-28 pb-16 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-warm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="font-display text-2xl">Email confirmed</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Your account is verified. You can now sign in.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full h-11 rounded-full">
              <Link to="/auth?view=login">Go to Login</Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              If you opened the email on a different device, just return to your browser and log in.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default AuthConfirmed;
