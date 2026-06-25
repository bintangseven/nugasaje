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
      required: ["title", "course", "abstract", "sections", "conclusion", "references"],
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
        slides: {
          type: "array",
          minItems: 5,
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              bullets: {
                type: "array",
                minItems: 2,
                items: { type: "string" },
              },
              notes: { type: "string", description: "Catatan pembicara, 2-3 kalimat." },
            },
            required: ["title", "bullets", "notes"],
            additionalProperties: false,
          },
        },
      },
      required: ["title", "subtitle", "slides"],
      additionalProperties: false,
    },
  },
} as const;

export const generateProjectContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
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
        : "Susun outline slide lengkap dengan judul, sub-judul, dan minimal 6 slide isi. Setiap slide harus punya 3-5 bullet ringkas dan catatan pembicara.",
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

    return { ok: true };
  });