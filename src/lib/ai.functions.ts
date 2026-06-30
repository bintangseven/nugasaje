import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const paperTool = {
  type: "function",
  function: {
    name: "submit_paper",
    description: "Susun paper akademik berbahasa Indonesia yang siap diserahkan ke dosen.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        course: { type: "string" },
        kata_pengantar: {
          type: "string",
          description: "Kata pengantar berisi ucapan syukur, tujuan penulisan singkat, ucapan terima kasih, dan harapan. Sekitar 100 kata, boleh 2-3 paragraf dipisah newline.",
        },
        abstract: { type: "string", description: "Abstrak singkat 100-150 kata." },
        sections: {
          type: "array",
          minItems: 3,
          items: {
            type: "object",
            properties: {
              heading: { type: "string" },
              paragraphs: {
                type: "array",
                minItems: 2,
                items: { type: "string", description: "Satu paragraf utuh." },
              },
              blocks: {
                type: "array",
                description:
                  "OPSIONAL tapi DIANJURKAN. Campuran paragraf & bullet list agar tulisan mengalir (target ~50% paragraf, ~50% bullet). Bila diisi, renderer pakai ini dan abaikan 'paragraphs'. Urutan blok = urutan tampil.",
                items: {
                  type: "object",
                  properties: {
                    kind: { type: "string", enum: ["paragraph", "bullets"] },
                    text: { type: "string", description: "Untuk kind=paragraph: paragraf utuh." },
                    items: {
                      type: "array",
                      description: "Untuk kind=bullets: 2-6 poin ringkas, tiap poin 1 kalimat.",
                      items: { type: "string" },
                    },
                  },
                  required: ["kind"],
                  additionalProperties: false,
                },
              },
              subsections: {
                type: "array",
                description: "Sub-bab (mis. 1.1 Latar Belakang). Opsional tapi sangat dianjurkan untuk BAB Pendahuluan & Pembahasan.",
                items: {
                  type: "object",
                  properties: {
                    heading: { type: "string", description: "Mis. '1.1 Latar Belakang'." },
                    paragraphs: {
                      type: "array",
                      minItems: 1,
                      items: { type: "string" },
                    },
                    blocks: {
                      type: "array",
                      description:
                        "OPSIONAL tapi DIANJURKAN. Campuran paragraf & bullet list (~50/50). Bila diisi, renderer pakai ini dan abaikan 'paragraphs'.",
                      items: {
                        type: "object",
                        properties: {
                          kind: { type: "string", enum: ["paragraph", "bullets"] },
                          text: { type: "string" },
                          items: { type: "array", items: { type: "string" } },
                        },
                        required: ["kind"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["heading", "paragraphs"],
                  additionalProperties: false,
                },
              },
            },
            required: ["heading", "paragraphs"],
            additionalProperties: false,
          },
        },
        conclusion: { type: "string" },
        references: {
          type: "array",
          minItems: 4,
          items: { type: "string", description: "Referensi gaya APA." },
        },
      },
      required: ["title", "course", "kata_pengantar", "abstract", "sections", "conclusion", "references"],
      additionalProperties: false,
    },
  },
} as const;

const presentationTool = {
  type: "function",
  function: {
    name: "submit_presentation",
    description: "Susun slide presentasi akademik berbahasa Indonesia.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        agenda: {
          type: "array",
          minItems: 3,
          maxItems: 6,
          items: { type: "string", description: "Satu poin agenda singkat (3-6 kata)." },
        },
        closing: {
          type: "object",
          properties: {
            message: { type: "string", description: "Pesan penutup singkat, mis. 'Terima kasih atas perhatiannya'." },
            cta: { type: "string", description: "Ajakan/kalimat penutup tambahan, opsional." },
          },
          required: ["message"],
          additionalProperties: false,
        },
        slides: {
          type: "array",
          minItems: 5,
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              layout: {
                type: "string",
                enum: ["section", "content", "two_column", "quote", "stats"],
                description:
                  "section = pembatas bab; content = judul + bullet; two_column = dua kolom bullet; quote = kutipan tebal; stats = 2-4 angka highlight.",
              },
              bullets: {
                type: "array",
                minItems: 1,
                items: { type: "string" },
              },
              bullets_right: {
                type: "array",
                description: "Hanya untuk layout two_column: bullet kolom kanan.",
                items: { type: "string" },
              },
              stats: {
                type: "array",
                description: "Hanya untuk layout stats: 2-4 item.",
                minItems: 2,
                maxItems: 4,
                items: {
                  type: "object",
                  properties: {
                    value: { type: "string", description: "Angka/teks pendek, mis. '85%'." },
                    label: { type: "string", description: "Label singkat di bawah angka." },
                  },
                  required: ["value", "label"],
                  additionalProperties: false,
                },
              },
              quote: { type: "string", description: "Hanya untuk layout quote: teks kutipan." },
              quote_source: { type: "string", description: "Sumber kutipan, opsional." },
              notes: { type: "string", description: "Catatan pembicara, 2-3 kalimat." },
            },
            required: ["title", "layout", "bullets", "notes"],
            additionalProperties: false,
          },
        },
      },
      required: ["title", "subtitle", "agenda", "closing", "slides"],
      additionalProperties: false,
    },
  },
} as const;

const BASIC_DAILY_LIMIT = 1;
const PRO_DAILY_LIMIT = 10;

export const generateProjectContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        attachment: z
          .object({
            name: z.string().max(200),
            mime: z.string().max(120),
            base64: z.string().max(15_000_000), // ~11MB binary
          })
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // Cek kuota langganan harian
    const { data: profile, error: profileErr } = await context.supabase
      .from("profiles")
      .select("plan,generations_used,generations_date,pro_until")
      .eq("id", context.userId)
      .maybeSingle();
    if (profileErr) throw new Error(profileErr.message);
    const isProActive =
      profile?.plan === "pro" &&
      (!profile.pro_until || new Date(profile.pro_until).getTime() > Date.now());
    const dailyLimit = isProActive ? PRO_DAILY_LIMIT : BASIC_DAILY_LIMIT;
    const today = new Date().toISOString().slice(0, 10);
    const sameDay = profile?.generations_date === today;
    const usedToday = sameDay ? profile?.generations_used ?? 0 : 0;
    if (usedToday >= dailyLimit) {
      throw new Error(
        isProActive
          ? `Kuota PRO harian habis (${dailyLimit}/hari). Coba lagi besok.`
          : `Kuota Basic habis (${dailyLimit}/hari). Upgrade ke PRO untuk 10 generate per hari.`,
      );
    }

    const { data: project, error } = await context.supabase
      .from("projects")
      .select("id,name,mission,answers")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!project) throw new Error("Proyek tidak ditemukan");

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY tidak tersedia");

    const answers = (project.answers ?? {}) as Record<string, string>;
    const isPaper = project.mission === "paper";
    const tool = isPaper ? paperTool : presentationTool;
    const toolName = tool.function.name;

    const systemPrompt = isPaper
      ? "Kamu adalah asisten akademik untuk mahasiswa Indonesia. Tugasmu menyusun paper berbahasa Indonesia yang rapi, runtut, dan dapat langsung diserahkan. Gunakan gaya formal akademik. Selalu panggil fungsi submit_paper."
      : "Kamu adalah asisten akademik untuk mahasiswa Indonesia. Tugasmu menyusun slide presentasi berbahasa Indonesia yang jelas dan terstruktur. Selalu panggil fungsi submit_presentation.";

    const userPrompt = [
      `Mahasiswa memberikan informasi berikut untuk ${isPaper ? "paper" : "presentasi"}:`,
      ...Object.entries(answers).map(([k, v]) => `- ${k}: ${v}`),
      "",
      isPaper
        ? [
            "Susun makalah akademik lengkap dengan struktur standar Indonesia:",
            "- BAB I PENDAHULUAN dengan sub-bab: 1.1 Latar Belakang, 1.2 Rumusan Masalah, 1.3 Tujuan Penulisan.",
            "- BAB II PEMBAHASAN dengan minimal 2-3 sub-bab sesuai topik (2.1, 2.2, dst).",
            "- BAB III PENUTUP boleh berisi ringkasan; isi kesimpulan utama di field 'conclusion'.",
            "Tiap sub-bab WAJIB pakai field 'blocks' dengan campuran ±50% paragraf & ±50% bullet list agar tulisan mengalir & enak dibaca. Pola umum: paragraf pembuka → bullet list (2-5 poin) → paragraf penghubung → bullet list lagi bila perlu → paragraf penutup. Jangan semua paragraf saja, jangan semua bullet saja.",
            "Bullet dipakai untuk: enumerasi, ciri-ciri, langkah-langkah, perbandingan poin, kelebihan/kekurangan. Paragraf untuk: argumen, narasi, analisis, transisi.",
            "Tambahkan abstrak 100-150 kata dan minimal 4 referensi APA.",
            "Gunakan heading 'BAB I PENDAHULUAN', 'BAB II PEMBAHASAN', 'BAB III PENUTUP' pada field 'heading' section.",
          ].join("\n")
        : [
            "Susun outline slide presentasi akademik dengan struktur standar:",
            "- title & subtitle untuk cover (subtitle = mata kuliah / konteks singkat).",
            "- agenda: 3-5 poin singkat sesuai isi slide.",
            "- slides: minimal 6 slide isi, urutan logis (Pendahuluan → Pembahasan → Penutup).",
            "- Sisipkan 1-2 slide layout 'section' sebagai pembatas bab besar.",
            "- Mayoritas slide pakai layout 'content' (3-5 bullet ringkas, maks 12 kata per bullet).",
            "- Gunakan 'two_column' untuk perbandingan, 'stats' untuk data angka, 'quote' untuk kutipan penting (opsional, hanya bila relevan).",
            "- Setiap slide wajib punya catatan pembicara 2-3 kalimat.",
            "- closing.message berisi ucapan terima kasih singkat.",
            "Sesuaikan kedalaman dan gaya dengan jawaban mahasiswa (audiens, gaya, jumlah slide).",
          ].join("\n"),
    ].join("\n");

    const att = data.attachment;
    const userContent: Array<Record<string, unknown>> = [{ type: "text", text: userPrompt }];
    if (att) {
      const mime = att.mime || "application/octet-stream";
      if (mime.startsWith("image/")) {
        userContent.push({
          type: "image_url",
          image_url: { url: `data:${mime};base64,${att.base64}` },
        });
      } else {
        userContent.push({
          type: "file",
          file: {
            filename: att.name,
            file_data: `data:${mime};base64,${att.base64}`,
          },
        });
      }
      userContent.push({
        type: "text",
        text: `Gunakan isi file terlampir "${att.name}" sebagai bahan utama. Ekstrak poin-poin penting, kutipan, dan data yang relevan; jangan menyalin mentah-mentah.`,
      });
    }

    // ===== Multi-stage generation (4 panggilan Gemini) =====
    // Tiap stage memanggil tool yang sama; hasilnya jadi konteks untuk stage berikutnya
    // supaya konten makin tebal, contoh konkret, dan catatan pembicara/paragraf
    // makin substantif. Lebih lambat tapi hasil jauh lebih lengkap.
    type ChatMsg = { role: "system" | "user" | "assistant"; content: unknown };

    const callTool = async (messages: ChatMsg[]): Promise<Record<string, unknown>> => {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages,
          tools: [tool],
          tool_choice: { type: "function", function: { name: toolName } },
        }),
      });
      if (res.status === 429) throw new Error("Batas pemakaian AI tercapai. Coba lagi sebentar lagi.");
      if (res.status === 402) throw new Error("Kredit AI workspace habis. Silakan tambahkan kredit.");
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`AI gateway error ${res.status}: ${text.slice(0, 200)}`);
      }
      const j = (await res.json()) as {
        choices?: Array<{
          message?: { tool_calls?: Array<{ function?: { name?: string; arguments?: string } }> };
        }>;
      };
      const argsText = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!argsText) throw new Error("AI tidak mengembalikan konten terstruktur.");
      try {
        return JSON.parse(argsText);
      } catch {
        throw new Error("Gagal mem-parsing hasil AI.");
      }
    };

    const stageInstruction = (stage: 1 | 2 | 3 | 4, prev: Record<string, unknown> | null): string => {
      if (isPaper) {
        switch (stage) {
          case 1:
            return "STAGE 1 (DRAFT): Susun kerangka makalah lengkap. Fokus struktur — BAB I/II/III + sub-bab, abstrak ringkas, dan tiap sub-bab WAJIB sudah pakai 'blocks' dengan minimal 1 paragraf + 1 bullet list (target ±50/50 paragraf/bullet supaya mengalir). Jangan tipis.";
          case 2:
            return `STAGE 2 (EXPAND): Ini draft awal kamu:\n\n${JSON.stringify(prev).slice(0, 8000)}\n\nPerluas SETIAP paragraf di BAB I & BAB II jadi 2-3x lebih panjang. Tambahkan definisi, contoh konkret, data/statistik (boleh estimasi wajar), dan kutipan dari referensi. Pertahankan ATAU tambahkan bullet list di tempat yang cocok (enumerasi, langkah, ciri, perbandingan) — target ±50% paragraf, ±50% bullet di tiap sub-bab. Jangan kurangi sub-bab.`;
          case 3:
            return `STAGE 3 (ENRICH): Versi terkini:\n\n${JSON.stringify(prev).slice(0, 12000)}\n\nLengkapi BAB III, perkuat conclusion jadi minimal 2 paragraf utuh, tambah analisis kritis. Pastikan tiap sub-bab punya 'blocks' yang seimbang: ±50% paragraf, ±50% bullet — pola ideal paragraf→bullet→paragraf→bullet→paragraf penutup. Pastikan abstrak 130-160 kata dan padat.`;
          case 4:
            return `STAGE 4 (POLISH): Versi siap-poles:\n\n${JSON.stringify(prev).slice(0, 14000)}\n\nFinal pass: rapikan transisi antar paragraf, pastikan tiap sub-bab benar-benar campuran ±50/50 paragraf & bullet (tidak ada sub-bab yang 100% paragraf atau 100% bullet), kata pengantar lengkap 3 paragraf, referensi minimal 6 dengan format APA benar dan beragam (jurnal, buku, web). Periksa konsistensi istilah. Kembalikan paper FINAL utuh.`;
        }
      } else {
        switch (stage) {
          case 1:
            return "STAGE 1 (DRAFT): Susun outline presentasi — title, subtitle, agenda, dan minimal 7 slide isi dengan judul + layout + 3 bullet draft + notes singkat. Fokus struktur dulu.";
          case 2:
            return `STAGE 2 (EXPAND BULLETS): Draft awal:\n\n${JSON.stringify(prev).slice(0, 8000)}\n\nPerluas SETIAP slide content: jadikan 4-6 bullet (maks 14 kata per bullet) yang lebih informatif dan substantif. Tambahkan 1-2 slide baru jika topik butuh (mis. studi kasus, data). Jangan tipis.`;
          case 3:
            return `STAGE 3 (ENRICH NOTES): Versi terkini:\n\n${JSON.stringify(prev).slice(0, 12000)}\n\nFokus catatan pembicara: tiap slide HARUS punya notes 4-6 kalimat yang detail — penjelasan konteks, contoh konkret, transisi ke slide berikut. Tambahkan minimal 1 slide layout 'stats' (3 angka) dan/atau 'two_column' jika belum ada.`;
          case 4:
            return `STAGE 4 (POLISH): Versi siap-poles:\n\n${JSON.stringify(prev).slice(0, 14000)}\n\nFinal pass: konsistensi gaya bullet, tidak ada slide kosong/tipis, agenda sinkron dengan urutan slide, closing.message + cta yang kuat. Pastikan ada 1-2 slide 'section' sebagai pembatas. Kembalikan presentasi FINAL utuh.`;
        }
      }
      return "";
    };

    const baseMessages: ChatMsg[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ];

    let parsed: Record<string, unknown> | null = null;
    for (const stage of [1, 2, 3, 4] as const) {
      const stageMsg = stageInstruction(stage, parsed);
      const messages: ChatMsg[] =
        stage === 1
          ? [...baseMessages, { role: "user", content: stageMsg }]
          : [...baseMessages, { role: "user", content: stageMsg }];
      parsed = await callTool(messages);
    }
    if (!parsed) throw new Error("AI tidak menghasilkan konten.");

    // ===== Beautiful.ai: bikin presentasi nyata (PPT desain auto) =====
    // Catatan: kita HANYA panggil createPresentation di sini. Export PPTX
    // dijalankan terpisah lewat finalizeBeautifulExport (atau on-demand saat
    // user mengunduh) supaya UI tidak menunggu render image AI ~60 detik.
    let beautiful: {
      presentationId: string;
      playerUrl?: string;
      downloadUrl?: string;
      fileName?: string;
      expiresAt?: string;
      format?: string;
    } | null = null;
    const bKey = process.env.BEAUTIFULAI_API_KEY;
    if (!isPaper && bKey) {
      try {
        const p = parsed as {
          title?: string;
          subtitle?: string;
          agenda?: string[];
          closing?: { message?: string; cta?: string };
          slides?: Array<{
            title: string;
            layout: string;
            bullets?: string[];
            bullets_right?: string[];
            stats?: Array<{ value: string; label: string }>;
            quote?: string;
            quote_source?: string;
            notes?: string;
          }>;
        };
        const mapType = (layout: string): string => {
          switch (layout) {
            case "section": return "title";
            case "quote": return "quote";
            case "stats": return "boxes-with-text";
            case "two_column": return "boxes-with-text";
            default: return "bullet-list";
          }
        };
        const slidesPayload: Array<{ title: string; summary: string; type: string }> = [];
        // Cover
        slidesPayload.push({
          title: p.title ?? "Presentasi",
          summary: p.subtitle ?? "",
          type: "title",
        });
        // Agenda
        if (p.agenda?.length) {
          slidesPayload.push({
            title: "Agenda",
            summary: p.agenda.map((a, i) => `${i + 1}. ${a}`).join("\n"),
            type: "agenda",
          });
        }
        // Content slides
        for (const s of p.slides ?? []) {
          const parts: string[] = [];
          if (s.bullets?.length) parts.push(s.bullets.map((b) => `• ${b}`).join("\n"));
          if (s.bullets_right?.length) parts.push(s.bullets_right.map((b) => `• ${b}`).join("\n"));
          if (s.stats?.length) parts.push(s.stats.map((st) => `${st.value} — ${st.label}`).join("\n"));
          if (s.quote) parts.push(`"${s.quote}"${s.quote_source ? ` — ${s.quote_source}` : ""}`);
          if (s.notes) parts.push(s.notes);
          slidesPayload.push({
            title: s.title,
            summary: parts.join("\n\n").slice(0, 1500) || s.title,
            type: mapType(s.layout),
          });
        }
        // Closing
        if (p.closing?.message) {
          slidesPayload.push({
            title: p.closing.message,
            summary: p.closing.cta ?? "Terima kasih atas perhatiannya.",
            type: "conclusion",
          });
        }

        const createRes = await fetch("https://www.beautiful.ai/api/v1/createPresentation", {
          method: "POST",
          headers: {
            "X-Api-Key": bKey,
            "content-type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({
            title: p.title ?? "Presentasi",
            language: "id",
            imageSource: "ai",
            ...(answers.__beautify_theme ? { themeId: answers.__beautify_theme } : {}),
            slides: slidesPayload,
          }),
        });
        if (!createRes.ok) {
          const t = await createRes.text();
          throw new Error(`createPresentation ${createRes.status}: ${t.slice(0, 200)}`);
        }
        const createJson = (await createRes.json()) as {
          presentationId: string;
          playerUrl?: string;
        };

        beautiful = {
          presentationId: createJson.presentationId,
          playerUrl: createJson.playerUrl,
        };
      } catch (e) {
        // Jangan gagalkan generate kalau Beautiful.ai down — fallback ke pptxgenjs
        console.error("[beautiful.ai] gagal:", e);
      }
    }

    const aiContext = {
      kind: isPaper ? "paper" : "presentation",
      content: parsed,
      beautiful,
      generated_at: new Date().toISOString(),
    };

    const { error: upErr } = await context.supabase
      .from("projects")
      .update({
        ai_context: aiContext as unknown as never,
        phase: "done",
        progress: 100,
        step_index: isPaper ? 7 : 6,
      })
      .eq("id", data.id);
    if (upErr) throw new Error(upErr.message);

    // Catat pemakaian harian (reset tiap hari)
    await context.supabase
      .from("profiles")
      .update({
        generations_used: usedToday + 1,
        generations_date: today,
      })
      .eq("id", context.userId);

    return { ok: true };
  });

// ===== Background-style finalize: export PPTX dari Beautiful.ai =====
// Dipanggil client setelah jeda ~60 detik (atau on-demand dari exportProject).
// Tidak mengubah phase project — hanya menyimpan downloadUrl agar unduh cepat.
export const finalizeBeautifulExport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const bKey = process.env.BEAUTIFULAI_API_KEY;
    if (!bKey) return { ok: false as const, reason: "no_key" };

    const { data: project, error } = await context.supabase
      .from("projects")
      .select("id,ai_context")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!project) throw new Error("Proyek tidak ditemukan");

    const ctx = (project.ai_context ?? {}) as {
      kind?: string;
      content?: unknown;
      beautiful?: {
        presentationId?: string;
        playerUrl?: string;
        downloadUrl?: string;
        fileName?: string;
        expiresAt?: string;
        format?: string;
      } | null;
      generated_at?: string;
    };
    const presentationId = ctx.beautiful?.presentationId;
    if (!presentationId) return { ok: false as const, reason: "no_presentation" };

    // Sudah punya downloadUrl yang masih valid >5 menit → tidak perlu export ulang.
    const existing = ctx.beautiful;
    const stillValid = existing?.expiresAt
      ? new Date(existing.expiresAt).getTime() > Date.now() + 5 * 60_000
      : false;
    if (existing?.downloadUrl && stillValid) {
      return { ok: true as const, cached: true };
    }

    const expRes = await fetch("https://www.beautiful.ai/api/v1/exportPresentation", {
      method: "POST",
      headers: {
        "X-Api-Key": bKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ presentationId, format: "pptx" }),
    });
    if (!expRes.ok) {
      const t = await expRes.text();
      throw new Error(`exportPresentation ${expRes.status}: ${t.slice(0, 200)}`);
    }
    const expJson = (await expRes.json()) as {
      downloadUrl: string;
      fileName: string;
      expiresAt: string;
      format: string;
    };

    const nextCtx = {
      ...ctx,
      beautiful: {
        ...(ctx.beautiful ?? {}),
        presentationId,
        downloadUrl: expJson.downloadUrl,
        fileName: expJson.fileName,
        expiresAt: expJson.expiresAt,
        format: expJson.format,
      },
    };
    const { error: upErr } = await context.supabase
      .from("projects")
      .update({ ai_context: nextCtx as unknown as never })
      .eq("id", data.id);
    if (upErr) throw new Error(upErr.message);

    return { ok: true as const, cached: false };
  });