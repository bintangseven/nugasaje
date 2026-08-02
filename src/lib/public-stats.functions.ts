import { createServerFn } from "@tanstack/react-start";

// Statistik publik agregat (angka saja, tanpa PII) untuk social proof di landing page.
export const getPublicStats = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [projects, done, users] = await Promise.all([
      supabaseAdmin.from("projects").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("projects").select("id", { count: "exact", head: true }).eq("phase", "done"),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    ]);
    return {
      projects: projects.count ?? 0,
      documents: done.count ?? 0,
      students: users.count ?? 0,
    };
  } catch {
    return { projects: 0, documents: 0, students: 0 };
  }
});
