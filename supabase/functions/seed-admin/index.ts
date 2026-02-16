import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const adminEmail = "admin@admin.local";
    const adminPassword = "admin123456";

    // Check if admin already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const adminUser = existingUsers?.users?.find(u => u.email === adminEmail);

    if (adminUser) {
      // Check if role already assigned
      const { data: role } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", adminUser.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!role) {
        await supabase.from("user_roles").insert({ user_id: adminUser.id, role: "admin" });
      }

      return new Response(JSON.stringify({ message: "Admin already exists" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create admin user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });

    if (createError) throw createError;

    // Assign admin role
    await supabase.from("user_roles").insert({
      user_id: newUser.user.id,
      role: "admin",
    });

    return new Response(JSON.stringify({ message: "Admin created successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
