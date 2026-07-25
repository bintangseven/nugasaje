import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type UnsplashHit = { url: string; alt: string; credit: string };

/**
 * Resolve satu batch query jadi URL gambar Unsplash.
 * Server-only karena butuh UNSPLASH_ACCESS_KEY.
 * Query yang gagal / kosong akan diabaikan (mapping tidak ada) — pemanggil
 * boleh render slide tanpa gambar dengan aman.
 */
export const resolveUnsplashImages = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ queries: z.array(z.string().min(1).max(120)).max(30) }).parse(input),
  )
  .handler(async ({ data }) => {
    const key = process.env.UNSPLASH_ACCESS_KEY;
    if (!key) return { images: {} as Record<string, UnsplashHit> };

    const uniq = Array.from(new Set(data.queries.map((q) => q.trim()).filter(Boolean)));
    const out: Record<string, UnsplashHit> = {};

    await Promise.all(
      uniq.map(async (q) => {
        try {
          const url = `https://api.unsplash.com/search/photos?per_page=1&orientation=landscape&content_filter=high&query=${encodeURIComponent(q)}`;
          const res = await fetch(url, {
            headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
          });
          if (!res.ok) return;
          const j = (await res.json()) as {
            results?: Array<{
              urls?: { regular?: string };
              alt_description?: string | null;
              user?: { name?: string; links?: { html?: string } };
            }>;
          };
          const hit = j.results?.[0];
          if (!hit?.urls?.regular) return;
          out[q] = {
            url: hit.urls.regular,
            alt: hit.alt_description ?? q,
            credit: hit.user?.name ? `Foto oleh ${hit.user.name} / Unsplash` : "Unsplash",
          };
        } catch {
          /* swallow — slide tetap render tanpa gambar */
        }
      }),
    );

    return { images: out };
  });
