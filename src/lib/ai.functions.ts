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
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
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
            "Setiap sub-bab minimal 1-2 paragraf utuh. Tambahkan abstrak 100-150 kata dan minimal 4 referensi APA.",
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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: toolName } },
      }),
    });

    if (response.status === 429) {
      throw new Error("Batas pemakaian AI tercapai. Coba lagi sebentar lagi.");
    }
    if (response.status === 402) {
      throw new Error("Kredit AI workspace habis. Silakan tambahkan kredit.");
    }
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI gateway error ${response.status}: ${text.slice(0, 200)}`);
    }

    const json = (await response.json()) as {
      choices?: Array<{
        message?: {
          tool_calls?: Array<{ function?: { name?: string; arguments?: string } }>;
        };
      }>;
    };
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    const argsText = call?.function?.arguments;
    if (!argsText) throw new Error("AI tidak mengembalikan konten terstruktur.");

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(argsText);
    } catch {
      throw new Error("Gagal mem-parsing hasil AI.");
    }

    const aiContext = {
      kind: isPaper ? "paper" : "presentation",
      content: parsed,
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