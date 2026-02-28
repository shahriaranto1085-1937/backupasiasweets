import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let alive = true;

    const applySession = async (s: Session | null) => {
      if (!alive) return;

      setSession(s);
      setUser(s?.user ?? null);

      if (!s?.user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // User exists -> check role
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", s.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (error) throw error;
        if (!alive) return;

        setIsAdmin(!!data);
      } catch (e) {
        // If role lookup fails, do NOT infinite-load
        if (!alive) return;
        setIsAdmin(false);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    // 1) Initial session fetch
    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session);
    });

    // 2) Listen for changes
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      applySession(newSession);
    });

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const loginAsAdmin = async (username: string, password: string) => {
    const email = `${username}@admin.local`;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, loading, isAdmin, loginAsAdmin, logout };
};
