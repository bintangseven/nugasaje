import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============================================================================
// PRESENTATION SCHEMA — HTML-first (Plus Jakarta Sans + Space Grotesk +
// Font Awesome 6 + MathML). Renderer memakai HTML fragment langsung di iframe;
// download PPTX dibuat di client via html2canvas + pptxgenjs.
// ============================================================================

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
          description:
            "Kata pengantar berisi ucapan syukur, tujuan penulisan singkat, ucapan terima kasih, dan harapan. Sekitar 100 kata, boleh 2-3 paragraf dipisah newline.",
        },
        abstract: { type: "string", description: "Abstrak singkat 100-150 kata." },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              heading: { type: "string" },
              paragraphs: {
                type: "array",
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
                description:
                  "Sub-bab (mis. 1.1 Latar Belakang). Opsional tapi sangat dianjurkan untuk BAB Pendahuluan & Pembahasan.",
                items: {
                  type: "object",
                  properties: {
                    heading: { type: "string", description: "Mis. '1.1 Latar Belakang'." },
                    paragraphs: {
                      type: "array",
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
          items: { type: "string", description: "Referensi gaya APA." },
        },
      },
      required: ["title", "course", "kata_pengantar", "abstract", "sections", "conclusion", "references"],
      additionalProperties: false,
    },
  },
} as const;

// HTML-first presentation tool. Setiap slide adalah fragment HTML lengkap
// yang akan di-mount di iframe 1280×720. Prompt mewajibkan pemakaian Plus
// Jakarta Sans + Space Grotesk (Google Fonts sudah di-load boilerplate),
// Font Awesome 6 icon class, dan MathML untuk rumus.
const presentationToolGateway = {
  type: "function",
  function: {
    name: "submit_presentation",
    description:
      "Susun deck presentasi akademik berbahasa Indonesia sebagai koleksi slide HTML modern.",
    parameters: {
      type: "object",
      properties: {
        meta: {
          type: "object",
          properties: {
            title: { type: "string" },
            subtitle: { type: "string" },
            palette: {
              type: "object",
              description: "Palet warna deck (hex 6 digit TANPA '#').",
              properties: {
                primary: { type: "string", description: "Warna brand utama." },
                accent: { type: "string", description: "Warna aksen tajam." },
                bg: { type: "string", description: "Warna latar cover/gelap." },
                ink: { type: "string", description: "Warna teks utama di atas latar terang." },
                muted: { type: "string", description: "Warna teks sekunder / caption." },
              },
              required: ["primary", "accent", "bg", "ink", "muted"],
              additionalProperties: false,
            },
          },
          required: ["title", "subtitle", "palette"],
          additionalProperties: false,
        },
        slides: {
          type: "array",
          description:
            "Minimal 6 slide, urutan logis: cover → agenda → konten (variasi layout) → closing.",
          items: {
            type: "object",
            properties: {
              kind: {
                type: "string",
                enum: ["cover", "agenda", "content", "quote", "stats", "closing"],
              },
              html: {
                type: "string",
                description:
                  "Fragment HTML lengkap satu slide. HARUS diawali <div class=\"slide\" ...> berukuran 1280x720. Boleh pakai inline style + CSS Grid/Flexbox. Font-family default 'Plus Jakarta Sans' untuk body, 'Space Grotesk' untuk heading (kedua font tersedia). Boleh <i class=\"fa-solid fa-*\"></i> (Font Awesome 6 tersedia global). Rumus matematika pakai <math>...</math> (MathML). Bila slide butuh foto, sisipkan <img data-unsplash=\"IMAGE_QUERY\" style=\"...\">, renderer akan mengisi src otomatis.",
              },
              imageQuery: {
                type: "string",
                description:
                  "OPSIONAL. Query pencarian gambar Unsplash yang cocok (bahasa Inggris, 2-5 kata). Bila diisi, renderer memilih 1 foto dan meng-inject ke elemen <img data-unsplash> di dalam html.",
              },
              notes: { type: "string", description: "Catatan pembicara 2-3 kalimat." },
            },
            required: ["kind", "html", "notes"],
            additionalProperties: false,
          },
        },
      },
      required: ["meta", "slides"],
      additionalProperties: false,
    },
  },
} as const;

const BASIC_DAILY_LIMIT = 2;
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
      profile?.plan === "pro" && (!profile.pro_until || new Date(profile.pro_until).getTime() > Date.now());
    const dailyLimit = isProActive ? PRO_DAILY_LIMIT : BASIC_DAILY_LIMIT;
    const today = new Date().toISOString().slice(0, 10);
    const sameDay = profile?.generations_date === today;
    const usedToday = sameDay ? (profile?.generations_used ?? 0) : 0;
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
    const toolName = isPaper ? paperTool.function.name : presentationToolGateway.function.name;

    // Terjemahkan pilihan user jadi instruksi konkret untuk AI
    const toneRaw = (answers.style ?? "").toLowerCase();
    const toneInstruction = toneRaw.includes("populer")
      ? "Gaya bahasa POPULER & mudah dibaca: kalimat pendek-menengah, hindari jargon, gunakan analogi sederhana, tetap sopan-akademik tapi ramah untuk pembaca awam."
      : toneRaw.includes("teknis")
        ? "Gaya bahasa TEKNIS PADAT DATA: banyak istilah teknis, angka/statistik, definisi presisi, kalimat efisien, minim kata pengisi."
        : "Gaya bahasa FORMAL AKADEMIK (skripsi/tesis): kalimat lengkap SPOK, kata baku KBBI, hindari kata sapaan, konsisten memakai istilah ilmiah.";

    const citRaw = (answers.citation_style ?? "").toLowerCase();
    const citationStyle: "apa" | "ieee" | "none" = citRaw.includes("ieee")
      ? "ieee"
      : citRaw.includes("tanpa")
        ? "none"
        : "apa";
    const citationInstruction =
      citationStyle === "ieee"
        ? "GUNAKAN SITASI IEEE. Sisipkan sitasi dalam teks memakai nomor kurung siku seperti [1], [2], [3] setiap kali mengutip fakta/data/definisi (target minimal 4-6 sitasi tersebar). Field 'references' WAJIB diurut sesuai nomor sitasi pertama, format IEEE: [1] A. Penulis, \"Judul,\" Jurnal, vol. X, no. Y, hlm. Z-Z, Thn. Referensi minimal 6, campur jurnal + buku + web. WAJIB pakai sumber NYATA & DAPAT DILACAK (nama penulis, jurnal/penerbit, tahun benar) — jangan mengarang. UTAMAKAN sumber terbitan 2020 ke atas (≥70% referensi); sumber lawas hanya boleh untuk teori klasik/definisi mendasar."
        : citationStyle === "none"
          ? "TANPA sitasi formal dalam teks. Tetap sediakan 4-6 item di 'references' sebagai daftar bacaan pendukung dengan format bebas namun konsisten. Gunakan sumber NYATA yang bisa dilacak, utamakan terbitan 2020 ke atas."
          : "GUNAKAN SITASI APA. Sisipkan sitasi dalam teks memakai format (Nama, Tahun) atau Nama (Tahun) setiap kali mengutip fakta/data/definisi (target minimal 4-6 sitasi tersebar). Field 'references' format APA edisi 7: Nama, A. B. (Tahun). Judul. Penerbit/Jurnal, vol(no), hlm. Referensi minimal 6, campur jurnal + buku + web. WAJIB pakai sumber NYATA & DAPAT DILACAK (nama penulis, jurnal/penerbit, DOI/URL bila ada, tahun benar) — jangan mengarang judul atau penulis fiktif. UTAMAKAN sumber terbitan 2020 ke atas (≥70% referensi); sumber lawas hanya boleh untuk teori klasik/definisi mendasar.";

    const systemPrompt = isPaper
      ? `Kamu adalah asisten akademik untuk mahasiswa Indonesia. Tugasmu menyusun paper berbahasa Indonesia yang rapi, runtut, dan dapat langsung diserahkan. ${toneInstruction} ${citationInstruction} Selalu panggil fungsi submit_paper.`
      : [
          `Kamu adalah SENIOR PRESENTATION DESIGNER yang membuat deck HTML modern.`,
          `Tugasmu MERANCANG deck presentasi akademik berbahasa Indonesia sebagai kumpulan slide HTML5+CSS3 (Grid/Flexbox) berukuran 1280×720 px, gaya editorial-modern setara portfolio desainer profesional.`,
          toneInstruction,
          ``,
          `=== SPEK TEKNIS SLIDE ===`,
          `1. Setiap 'html' WAJIB berupa satu element <div class="slide" style="width:1280px;height:720px;..."> yang isinya self-contained (boleh nested div/section/grid). JANGAN sertakan <html>, <head>, <body>, <script>, <link>, atau <style>. Semua styling INLINE via atribut style="" atau class utility tailwind (Tailwind tidak tersedia — pakai inline style saja).`,
          `2. Font sudah tersedia global: 'Plus Jakarta Sans' (body) & 'Space Grotesk' (heading). Pakai lewat inline style font-family.`,
          `3. Ikon: Font Awesome 6 sudah dimuat. Pakai <i class="fa-solid fa-lightbulb" style="color:#..;font-size:32px"></i> dsb.`,
          `4. Rumus matematika WAJIB pakai MathML: <math xmlns="http://www.w3.org/1998/Math/MathML">...</math>.`,
          `5. Gambar: sisipkan <img data-unsplash="query kata kunci inggris" alt="..." style="width:100%;height:100%;object-fit:cover;border-radius:16px" />. Renderer akan mengganti src otomatis dari Unsplash. Bila tidak butuh gambar, jangan pakai tag <img>.`,
          `6. Warna: gunakan palet dari meta.palette (primary, accent, bg, ink, muted). Kontras teks WAJIB ≥ 4.5:1.`,
          `7. Hierarki: Cover judul 64-88px bold Space Grotesk; section title 44-56px; body 18-22px Plus Jakarta Sans; caption 13-15px.`,
          `8. Layout: variasikan tiap slide (hero kiri + visual kanan, grid 2/3 kolom kartu, split 50/50, stat block angka besar, quote frame, timeline). Jangan 2 slide berturut komposisi identik.`,
          `9. Cover & closing pakai latar gelap (bg) dengan teks inkInverse otomatis (pilih warna terang). Slide konten latar putih atau warna surface lembut.`,
          `10. Whitespace lega: padding minimal 48px di dalam .slide.`,
          ``,
          `=== LARANGAN ===`,
          `A. JANGAN pakai garis aksen tipis di bawah judul (ciri AI generik). Gunakan whitespace atau shift warna latar.`,
          `B. JANGAN pakai <script>, JS interaktif, animasi kompleks, atau resource eksternal selain Font Awesome/Google Fonts (sudah dimuat).`,
          `C. JANGAN slide teks-saja tanpa elemen visual (kartu / ikon / angka besar / gambar).`,
          `D. JANGAN pakai warna cream/beige generik.`,
          `E. JANGAN buat html melebihi 1280×720; konten harus fit.`,
          ``,
          `Selalu panggil fungsi submit_presentation.`,
        ].join("\n");

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
            "- Mayoritas slide pakai layout 'content' dengan GAYA NARATIF: WAJIB isi field 'blocks' dengan campuran ±50% paragraf naratif + ±50% bullet list. Pola tiap slide: paragraf pembuka (2-4 kalimat) → bullet list (2-4 poin, maks 14 kata) → paragraf penutup singkat bila perlu. JANGAN slide yang 100% bullet dan JANGAN 100% paragraf.",
            "- Gunakan 'two_column' untuk perbandingan, 'stats' untuk data angka, 'quote' untuk kutipan penting (opsional, hanya bila relevan).",
            "- Setiap slide wajib punya catatan pembicara 2-3 kalimat.",
            "- closing.message berisi ucapan terima kasih singkat.",
            "Sesuaikan kedalaman dan gaya dengan jawaban mahasiswa (audiens, gaya, jumlah slide).",
          ].join("\n"),
    ].join("\n");

    const att = data.attachment;
    // ---- Lovable Gateway (paper) attachment format ----
    const gatewayUserContent: Array<Record<string, unknown>> = [{ type: "text", text: userPrompt }];
    if (att) {
      const mime = att.mime || "application/octet-stream";
      if (mime.startsWith("image/")) {
        gatewayUserContent.push({ type: "image_url", image_url: { url: `data:${mime};base64,${att.base64}` } });
      } else {
        gatewayUserContent.push({
          type: "file",
          file: { filename: att.name, file_data: `data:${mime};base64,${att.base64}` },
        });
      }
      gatewayUserContent.push({
        type: "text",
        text: `Gunakan isi file terlampir "${att.name}" sebagai bahan utama. Ekstrak poin-poin penting, kutipan, dan data yang relevan; jangan menyalin mentah-mentah.`,
      });
    }
    // ===== Multi-stage generation (4 panggilan Gemini) =====
    // Tiap stage memanggil tool yang sama; hasilnya jadi konteks untuk stage berikutnya
    // supaya konten makin tebal, contoh konkret, dan catatan pembicara/paragraf
    // makin substantif. Lebih lambat tapi hasil jauh lebih lengkap.
    type ChatMsg = { role: "system" | "user" | "assistant"; content: unknown };

    // Paper: Lovable Gateway (Gemini via OpenAI-compatible tool calls)
    const gatewayTool = isPaper ? paperTool : presentationToolGateway;
    const gatewayToolName = isPaper ? paperTool.function.name : presentationToolGateway.function.name;
    const callGatewayTool = async (messages: ChatMsg[]): Promise<Record<string, unknown>> => {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3.6-flash",
          messages,
          tools: [gatewayTool],
          tool_choice: { type: "function", function: { name: gatewayToolName } },
        }),
      });
      if (res.status === 429) throw new Error("Batas pemakaian AI tercapai. Coba lagi sebentar lagi.");
      if (res.status === 402) throw new Error("Kredit AI workspace habis. Silakan tambahkan kredit.");
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`AI gateway error ${res.status}: ${text.slice(0, 200)}`);
      }
      const j = (await res.json()) as {
        choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }>;
      };
      const argsText = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!argsText) throw new Error("AI tidak mengembalikan konten terstruktur.");
      try {
        return JSON.parse(argsText);
      } catch {
        throw new Error("Gagal mem-parsing hasil AI.");
      }
    };

    // Paper & presentasi sama-sama pakai Lovable AI Gateway (Gemini Flash).
    // Claude API (ANTHROPIC_API_KEY) di-unbind sementara.
    void toolName;

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
            return `STAGE 4 (POLISH): Versi siap-poles:\n\n${JSON.stringify(prev).slice(0, 14000)}\n\nFinal pass: rapikan transisi antar paragraf, pastikan tiap sub-bab benar-benar campuran ±50/50 paragraf & bullet (tidak ada sub-bab yang 100% paragraf atau 100% bullet), kata pengantar lengkap 3 paragraf, dan referensi minimal 6 mengikuti FORMAT SITASI yang diminta di system prompt (APA / IEEE / tanpa sitasi) — jangan campur gaya sitasi. Periksa konsistensi istilah. Kembalikan paper FINAL utuh.`;
        }
      } else {
        switch (stage) {
          case 1:
            return "STAGE 1 (DRAFT DECK): Susun meta (title, subtitle, palette) + minimal 7 slide dalam bentuk fragment HTML lengkap sesuai spek. Wajib: 1 cover, 1 agenda, minimal 4 slide content (variasi layout), 1 closing. Setiap slide berukuran 1280x720, self-contained, memakai Plus Jakarta Sans / Space Grotesk, warna dari palette.";
          case 2:
            return `STAGE 2 (POLISH DECK): Draft awal:\n\n${JSON.stringify(prev).slice(0, 12000)}\n\nSempurnakan tiap slide: pastikan variasi layout (tidak monoton), tambah elemen visual (kartu, ikon Font Awesome, angka besar, atau <img data-unsplash="..."> dengan query bahasa Inggris yang relevan) di setiap slide, isi notes 3-5 kalimat, dan pastikan tidak ada teks overflow. Kembalikan deck FINAL utuh.`;
          case 3:
          case 4:
            return `PASS FINAL: Konten sekarang:\n\n${JSON.stringify(prev).slice(0, 12000)}\n\nKembalikan deck yang sama tanpa perubahan besar — cukup rapikan konsistensi warna, spacing padding 48px, dan tambahkan imageQuery bila slide punya <img data-unsplash>.`;
        }
      }
      return "";
    };

    let parsed: Record<string, unknown> | null = null;
    // Presentasi cukup 2 stage supaya cepat & tidak boros token.
    const stages: readonly (1 | 2 | 3 | 4)[] = isPaper ? ([1, 2, 3, 4] as const) : ([1, 2] as const);
    const baseMessages: ChatMsg[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: gatewayUserContent },
    ];
    for (const stage of stages) {
      const stageMsg = stageInstruction(stage, parsed);
      const messages: ChatMsg[] = [...baseMessages, { role: "user", content: stageMsg }];
      parsed = await callGatewayTool(messages);
    }
    if (!parsed) throw new Error("AI tidak menghasilkan konten.");

    // Resolve gambar Unsplash untuk presentasi — inject URL ke slides.
    if (!isPaper) {
      try {
        const slidesArr = Array.isArray((parsed as { slides?: unknown }).slides)
          ? ((parsed as { slides: Array<Record<string, unknown>> }).slides)
          : [];
        const queries = slidesArr
          .map((s) => (typeof s.imageQuery === "string" ? s.imageQuery.trim() : ""))
          .filter((q) => q.length > 0);
        if (queries.length > 0) {
          const { resolveUnsplashImages } = await import("./unsplash.functions");
          const { images } = await resolveUnsplashImages({ data: { queries } });
          for (const s of slidesArr) {
            const q = typeof s.imageQuery === "string" ? s.imageQuery.trim() : "";
            const hit = q ? images[q] : undefined;
            if (hit && typeof s.html === "string") {
              // Ganti atribut data-unsplash="..." menjadi src="..." (yang pertama saja).
              s.html = s.html.replace(
                /<img\s+([^>]*?)data-unsplash="[^"]*"([^>]*)>/i,
                (_m, pre, post) => `<img ${pre}src="${hit.url}" alt="${hit.alt.replace(/"/g, "&quot;")}"${post}>`,
              );
              s.imageCredit = hit.credit;
              s.imageUrl = hit.url;
            }
          }
        }
      } catch (unsplashErr) {
        console.warn("[unsplash] gagal resolve gambar:", unsplashErr);
      }
    }

    // Beautiful.ai dinonaktifkan sementara — PPT dibangun via pptxgenjs
    // dari konten AI yang sama (gemini-2.5-flash) seperti paper.
    const aiContext = {
      kind: isPaper ? "paper" : "presentation",
      content: parsed,
      beautiful: null,
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
    // Gunakan admin client agar melewati trigger anti-privilege-escalation
    // yang memblokir perubahan kolom generations_* dari user biasa.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: quotaErr } = await supabaseAdmin
      .from("profiles")
      .update({
        generations_used: usedToday + 1,
        generations_date: today,
      })
      .eq("id", context.userId);
    if (quotaErr) {
      console.error("[quota] gagal update kuota harian:", quotaErr.message);
    }

    return { ok: true };
  });

// Beautiful.ai finalize dinonaktifkan sementara.
