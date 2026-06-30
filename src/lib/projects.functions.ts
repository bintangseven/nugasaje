import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { TablesUpdate } from "@/integrations/supabase/types";

const MissionEnum = z.enum(["paper", "presentation"]);
const PhaseEnum = z.enum(["interview", "working", "done"]);

const ProjectPatch = z.object({
  name: z.string().min(1).max(200).optional(),
  phase: PhaseEnum.optional(),
  progress: z.number().int().min(0).max(100).optional(),
  step_index: z.number().int().min(-1).max(50).optional(),
  question_index: z.number().int().min(0).max(50).optional(),
  answers: z.record(z.string(), z.string()).optional(),
  ai_context: z.record(z.string(), z.any()).optional(),
});

export const listProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("projects")
      .select(
        "id,name,mission,phase,progress,step_index,question_index,answers,ai_context,created_at,updated_at",
      )
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getProject = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("projects")
      .select(
        "id,name,mission,phase,progress,step_index,question_index,answers,ai_context,created_at,updated_at",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        mission: MissionEnum,
        name: z.string().min(1).max(200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("projects")
      .insert({
        user_id: context.userId,
        mission: data.mission,
        name: data.name,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        patch: ProjectPatch,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const patch = data.patch as TablesUpdate<"projects">;
    const { error } = await context.supabase
      .from("projects")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("projects")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id,name,email,university,major,semester,plan,generations_used,generations_date,pro_until")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const BASIC_DAILY_LIMIT = 2;
export const PRO_DAILY_LIMIT = 10;
export const PRO_PRICE_IDR = 50000;

/**
 * Placeholder upgrade — TANPA pembayaran nyata.
 * Sekarang menandai akun sebagai PRO selama 30 hari supaya alur kuota bisa diuji.
 * Sambungkan ke payment gateway (Midtrans/Xendit/dll) lalu panggil ini setelah
 * webhook pembayaran sukses, atau pindahkan logikanya ke webhook handler.
 */
export const upgradeToPro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const until = new Date();
    until.setDate(until.getDate() + 30);
    const { error } = await context.supabase
      .from("profiles")
      .update({ plan: "pro", pro_until: until.toISOString() })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true, pro_until: until.toISOString() };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().max(120).optional(),
        university: z.string().max(160).optional(),
        major: z.string().max(160).optional(),
        semester: z.string().max(40).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update(data)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });