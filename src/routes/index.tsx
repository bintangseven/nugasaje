import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { MissionCard } from "@/components/MissionCard";
import { ProjectCard } from "@/components/ProjectCard";
import { Reveal } from "@/components/Reveal";
import { Footer } from "@/components/Footer";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-auth";
import { defaultProjectName, missions, type MissionType, type ProjectRow } from "@/lib/mock-data";
import { createProject, listProjects } from "@/lib/projects.functions";
import logoAsset from "@/assets/nugasinaje-logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nugasinaje — Selesaikan tugas kuliahmu lebih cepat" },
      {
        name: "description",
        content:
          "Nugasinaje adalah ruang kerja akademik untuk mahasiswa Indonesia. Pilih misi, jawab beberapa pertanyaan, dan tugasmu selesai.",
      },
      { property: "og:title", content: "Nugasinaje" },
      {
        property: "og:description",
        content: "Ruang kerja akademik untuk menyelesaikan paper dan presentasi.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, loaded } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const listFn = useServerFn(listProjects);
  const createFn = useServerFn(createProject);
  const paperRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = paperRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rx: -y * 8, ry: x * 10 });
  }
  function handleLeave() {
    setTilt({ rx: 0, ry: 0 });
  }

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => listFn(),
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: (mission: MissionType) =>
      createFn({ data: { mission, name: defaultProjectName(mission) } }),
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (row?.id) navigate({ to: "/mission/$id", params: { id: row.id } });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Gagal membuat proyek"),
  });

  function handleStart(mission: MissionType) {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    create.mutate(mission);
  }

  const recent = ((projectsQuery.data ?? []) as ProjectRow[]).slice(0, 3);

  return (
    <div className="min-h-screen bg-background noise-overlay">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-20">
        <section className="grid items-center gap-14 md:grid-cols-[1.05fr_0.95fr]">
          <Reveal>
            <img src={logoAsset.url} alt="Nugasinaje" className="mb-6 h-16 w-auto" />
            <span className="eyebrow">AI penyusun tugas kuliah</span>
            <h1 className="mt-5 font-display font-semibold" style={{ fontSize: "clamp(2.4rem, 4.6vw, 3.6rem)" }}>
              Makalah &amp; PPT kelar <span className="mark-highlight">dalam satu klik.</span>
            </h1>
            <p className="mt-6 max-w-[46ch] text-[1.08rem] leading-relaxed" style={{ color: "var(--graphite)" }}>
              Pilih satu misi, jawab beberapa pertanyaan singkat, dan biarkan Nugasinaje menyusun
              struktur, isi, sampai daftar pustaka. Tinggal unduh, tinggal kumpulkan.
            </p>
          {loaded && !user && (
            <p className="mt-5 text-sm" style={{ color: "var(--graphite)" }}>
              <Link to="/auth" className="font-medium text-foreground hover:underline">
                Masuk
              </Link>{" "}
              untuk menyimpan proyekmu dan melanjutkannya dari perangkat manapun.
            </p>
          )}
          </Reveal>

          <div
            className="relative flex min-h-[420px] items-center justify-center"
            style={{ perspective: "1200px" }}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
          >
            <div
              ref={paperRef}
              className="relative w-[300px] rounded-[4px] bg-white p-8 shadow-elegant"
              style={{
                transform: `translateY(${scrollY * -0.06}px) rotate(${-2.4 + tilt.ry * 0.2}deg) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                transition: "transform 200ms cubic-bezier(.22,.61,.36,1)",
                transformStyle: "preserve-3d",
                backgroundImage:
                  "repeating-linear-gradient(#FFFFFF 0px, #FFFFFF 27px, var(--line) 28px)",
              }}
            >
              <div
                className="absolute font-hand"
                style={{
                  top: "-18px",
                  left: "-30px",
                  transform: "rotate(-7deg)",
                  background: "var(--highlighter)",
                  color: "var(--stamp-deep)",
                  padding: "8px 14px",
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  boxShadow: "0 8px 16px -8px rgba(0,0,0,0.25)",
                }}
              >
                Revisi bab 3 malam ini? aman.
              </div>
              <span
                className="font-mono-eyebrow inline-block bg-white"
                style={{ fontSize: "0.66rem", color: "var(--graphite)" }}
              >
                BAB I — PENDAHULUAN
              </span>
              <div className="mt-2 inline-block bg-white font-display text-[1.05rem] font-semibold">
                Pengaruh Literasi Digital terhadap Minat Baca Mahasiswa
              </div>
              {["92%", "78%", "85%", "60%", "92%", "78%"].map((w, i) => (
                <div
                  key={i}
                  className="my-3.5 h-2 rounded-[2px] animate-pulse"
                  style={{ width: w, background: "#E7E1D2", animationDelay: `${i * 120}ms`, animationDuration: "2.6s" }}
                />
              ))}
              <svg
                className="absolute"
                style={{ right: "-26px", bottom: "-22px", width: 128, height: 128, transform: "rotate(-11deg)" }}
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g fill="none" stroke="#B23A2F" strokeWidth="3.4" opacity="0.92">
                  <circle cx="100" cy="100" r="86" />
                  <circle cx="100" cy="100" r="74" />
                </g>
                <text x="100" y="92" textAnchor="middle" fontFamily="Space Mono, monospace" fontSize="22" fontWeight="700" fill="#B23A2F">ACC</text>
                <text x="100" y="120" textAnchor="middle" fontFamily="Space Mono, monospace" fontSize="11" letterSpacing="2" fill="#B23A2F">NUGASINAJE</text>
                <path d="M70 132 L92 150 L132 108" stroke="#B23A2F" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </section>

        <section id="misi" className="mt-20 scroll-mt-24">
          <Reveal className="mb-10 max-w-2xl">
            <span className="eyebrow">Dua alat, satu alur kerja</span>
            <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
              Dari topik kosong sampai file siap kumpul
            </h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-2">
          {missions.map((m, i) => (
            <Reveal key={m.id} delay={i * 90}>
              <MissionCard
                missionType={m.id}
                icon={m.icon}
                title={m.title}
                description={m.description}
                estimate={m.estimate}
                output={m.output}
                loading={create.isPending && create.variables === m.id}
                onStart={handleStart}
              />
            </Reveal>
          ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="cara" className="mt-24 scroll-mt-24">
          <Reveal className="mb-12 max-w-2xl">
            <span className="eyebrow">Cara memulai</span>
            <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
              Tiga langkah, satu file siap kumpul
            </h2>
            <p className="mt-3 text-[1rem]" style={{ color: "var(--graphite)" }}>
              Tidak perlu prompt panjang. Cukup jawab pertanyaan singkat, sisanya AI yang kerjakan.
            </p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Pilih misi",
                desc: "Tentukan apakah kamu butuh makalah atau presentasi. Satu klik, satu alur.",
              },
              {
                step: "02",
                title: "Isi brief singkat",
                desc: "Jawab beberapa pertanyaan: topik, gaya, jumlah bab/slide, dan referensi.",
              },
              {
                step: "03",
                title: "Unduh hasilnya",
                desc: "AI menyusun struktur, isi, dan daftar pustaka. Tinggal unduh .docx / .pptx.",
              },
            ].map((s, i) => (
              <Reveal key={s.step} delay={i * 100}>
                <div className="group relative h-full overflow-hidden rounded-[10px] border border-border bg-card p-7 transition-all hover:-translate-y-1 hover:shadow-elegant">
                  <div
                    className="absolute -right-6 -top-8 font-display font-bold leading-none transition-transform group-hover:scale-110"
                    style={{ fontSize: "7rem", color: "var(--paper-deep)" }}
                  >
                    {s.step}
                  </div>
                  <span className="eyebrow relative">Langkah {s.step}</span>
                  <h3 className="relative mt-3 font-display text-xl font-semibold">{s.title}</h3>
                  <p className="relative mt-2 text-sm leading-relaxed" style={{ color: "var(--graphite)" }}>
                    {s.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section id="harga" className="mt-24 scroll-mt-24">
          <Reveal className="mb-10 max-w-2xl">
            <span className="eyebrow">Harga</span>
            <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
              Mulai gratis, naik kelas saat butuh
            </h2>
            <p className="mt-3 text-[1rem]" style={{ color: "var(--graphite)" }}>
              Promo pembukaan: paket Pro turun dari{" "}
              <span className="line-through" style={{ color: "var(--ink-soft)" }}>Rp100.000</span>{" "}
              jadi cuma <span className="mark-highlight font-semibold">Rp50.000 / bulan</span>.
            </p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-2">
            {/* BASIC */}
            <Reveal>
              <div className="flex h-full flex-col rounded-[10px] border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:shadow-elegant">
                <span className="eyebrow">Basic</span>
                <h3 className="mt-3 font-display text-2xl font-semibold">Gratis selamanya</h3>
                <p className="mt-2 text-sm" style={{ color: "var(--graphite)" }}>
                  Cocok buat coba-coba dan tugas ringan.
                </p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-bold">Rp0</span>
                  <span className="text-sm" style={{ color: "var(--graphite)" }}>/bulan</span>
                </div>

                <ul className="mt-6 space-y-3 text-sm" style={{ color: "var(--ink-soft)" }}>
                  {[
                    "2 submission per hari",
                    "Akses kedua misi (Makalah & PPT)",
                    "Riwayat proyek tersinkron",
                    "Unduh .docx & .pptx",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--stamp)" }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => (user ? navigate({ to: "/" }) : navigate({ to: "/auth" }))}
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-md border border-foreground bg-transparent px-5 py-3 text-sm font-bold text-foreground transition-all hover:-translate-y-0.5 hover:bg-foreground hover:text-background"
                >
                  Mulai gratis
                </button>
              </div>
            </Reveal>

            {/* PRO */}
            <Reveal delay={100}>
              <div
                className="relative flex h-full flex-col overflow-hidden rounded-[10px] p-8 text-background shadow-elegant"
                style={{ background: "var(--ink)" }}
              >
                <div
                  className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(244,211,94,0.35), transparent 70%)" }}
                />
                <div className="flex items-center justify-between">
                  <span
                    className="font-mono-eyebrow uppercase"
                    style={{ fontSize: "0.72rem", letterSpacing: "0.16em", color: "var(--highlighter)" }}
                  >
                    ● Pro
                  </span>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wider"
                    style={{ background: "var(--stamp)", color: "var(--paper)" }}
                  >
                    <Sparkles className="h-3 w-3" />
                    Promo 50%
                  </span>
                </div>

                <h3 className="mt-3 font-display text-2xl font-semibold">Buat yang serius</h3>
                <p className="mt-2 text-sm" style={{ color: "rgba(250,246,236,0.7)" }}>
                  Untuk minggu UTS, UAS, dan revisi dosen yang nggak ada habisnya.
                </p>

                <div className="mt-6 flex items-baseline gap-3">
                  <span className="font-display text-5xl font-bold">Rp50rb</span>
                  <span className="text-sm" style={{ color: "rgba(250,246,236,0.65)" }}>/bulan</span>
                  <span className="text-sm line-through" style={{ color: "rgba(250,246,236,0.45)" }}>
                    Rp100rb
                  </span>
                </div>

                <ul className="mt-6 space-y-3 text-sm" style={{ color: "rgba(250,246,236,0.92)" }}>
                  {[
                    "10 submission per hari",
                    "Prioritas antrian generate",
                    "Template PPT premium (Beautiful.ai)",
                    "Riwayat & ekspor tanpa batas",
                    "Dukungan via WhatsApp",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--highlighter)" }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => (user ? navigate({ to: "/profile" }) : navigate({ to: "/auth" }))}
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-bold transition-all hover:-translate-y-0.5"
                  style={{ background: "var(--highlighter)", color: "var(--ink)" }}
                >
                  Upgrade ke Pro
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </Reveal>
          </div>
        </section>

        {user && (
        <section className="mt-20">
          <Reveal className="flex items-end justify-between">
            <div>
              <span className="eyebrow">Riwayat</span>
              <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">
                Proyek Terbaru
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--graphite)" }}>
                Tersinkron otomatis di seluruh perangkatmu.
              </p>
            </div>
            <Link
              to="/projects"
              className="text-sm font-medium text-foreground hover:underline"
            >
              Lihat semua →
            </Link>
          </Reveal>
          {projectsQuery.isLoading ? (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-2xl border border-border bg-card"
                />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <p className="text-sm text-muted-foreground">
                Belum ada proyek. Mulai misi di atas untuk membuat yang pertama.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {recent.map((p, i) => (
                <Reveal key={p.id} delay={i * 90}>
                  <ProjectCard project={p} />
                </Reveal>
              ))}
            </div>
          )}
        </section>
        )}

        {/* FINAL CTA */}
        <section className="mt-24">
          <Reveal className="mb-12 max-w-2xl" >
            <span className="eyebrow">FAQ</span>
            <h2 id="faq" className="mt-3 scroll-mt-24 font-display text-3xl font-semibold md:text-4xl">
              Pertanyaan yang sering ditanya
            </h2>
          </Reveal>
          <div className="mb-24 grid gap-4 md:grid-cols-2">
            {[
              {
                q: "Apakah hasilnya bisa diedit?",
                a: "Bisa. File .docx bisa dibuka di Word/Google Docs, dan .pptx bisa diedit di PowerPoint, Keynote, atau Canva. Semua isi bebas kamu ubah.",
              },
              {
                q: "Apakah hasilnya akan terdeteksi AI?",
                a: "Kami menyusun struktur dan kalimat ala mahasiswa, bukan hasil mentah model. Tapi tetap baca ulang, tambahkan referensi pribadi, dan sesuaikan gaya kamu sendiri sebelum dikumpulkan.",
              },
              {
                q: "Bagaimana kalau hasilnya kurang sesuai?",
                a: "Kamu bisa ulangi dengan brief yang lebih spesifik (tambah outline, gaya bahasa, atau lampirkan PDF referensi). Tiap submission gratis di paket Basic dan murah di Pro.",
              },
              {
                q: "Apakah datanya aman?",
                a: "Brief, jawaban, dan hasilmu hanya bisa diakses oleh akunmu sendiri. Lihat halaman kebijakan privasi untuk detail penyimpanan dan retensi.",
              },
              {
                q: "Bagaimana cara upgrade ke Pro?",
                a: "Masuk ke menu Profil dan tekan Upgrade. Selama masa promo, paket Pro hanya Rp50.000/bulan dengan 10 submission/hari.",
              },
              {
                q: "Bisa dipakai untuk skripsi/jurnal?",
                a: "Bisa untuk bab pendukung, ringkasan, dan kerangka. Untuk karya akhir, gunakan sebagai asisten — referensi dan analisis utama tetap perlu kamu validasi.",
              },
            ].map((item, i) => (
              <Reveal key={item.q} delay={i * 60}>
                <details className="group rounded-[10px] border border-border bg-card p-5 transition-all hover:shadow-elegant">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3 font-display text-base font-semibold">
                    <span>{item.q}</span>
                    <span
                      className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm transition-transform group-open:rotate-45"
                      style={{ borderColor: "var(--line)", color: "var(--graphite)" }}
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--graphite)" }}>
                    {item.a}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div
              className="relative overflow-hidden rounded-[14px] p-10 md:p-14"
              style={{
                background: "var(--paper-deep)",
                border: "1px solid var(--line)",
              }}
            >
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(244,211,94,0.6), transparent 70%)" }}
              />
              <div
                className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(178,58,47,0.18), transparent 70%)" }}
              />
              <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
                <div>
                  <span className="eyebrow">Siap mulai?</span>
                  <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
                    Deadline besok? <span className="mark-highlight">Mulai sekarang.</span>
                  </h2>
                  <p className="mt-4 max-w-[48ch] text-[1rem]" style={{ color: "var(--graphite)" }}>
                    Pilih satu misi, jawab brief singkat, dan biarkan Nugasinaje yang lembur.
                    Gratis untuk dicoba — tanpa kartu kredit.
                  </p>
                </div>
                <div className="flex flex-col gap-3 md:items-end">
                  <button
                    type="button"
                    onClick={() => (user ? handleStart("paper") : navigate({ to: "/auth" }))}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-6 py-3.5 text-sm font-bold text-background transition-all hover:-translate-y-0.5 hover:shadow-elegant"
                  >
                    Mulai misi pertama
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <a
                    href="#harga"
                    className="text-sm font-semibold text-foreground hover:underline"
                  >
                    Lihat paket Pro →
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </div>
  );
}
