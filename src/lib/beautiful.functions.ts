import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type BeautifulTheme = {
  id: string;
  name: string;
  source: "built_in" | "user" | "team";
  imageStyle?: string;
  isDefault?: boolean;
};

export const listBeautifulThemes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<{ themes: BeautifulTheme[] }> => {
    const key = process.env.BEAUTIFULAI_API_KEY;
    if (!key) return { themes: [] };
    const res = await fetch("https://www.beautiful.ai/api/v1/getThemes", {
      headers: { "X-Api-Key": key, accept: "application/json" },
    });
    if (!res.ok) return { themes: [] };
    const j = (await res.json()) as {
      themes?: Array<{
        id: string;
        name: string;
        source: "built_in" | "user" | "team";
        metadata?: { imageStyle?: string; isDefault?: boolean; isHidden?: boolean };
      }>;
    };
    const themes = (j.themes ?? [])
      .filter((t) => !t.metadata?.isHidden)
      .map((t) => ({
        id: t.id,
        name: t.name,
        source: t.source,
        imageStyle: t.metadata?.imageStyle,
        isDefault: t.metadata?.isDefault,
      }));
    return { themes };
  });