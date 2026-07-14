import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, GraduationCap, Loader2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { completeOnboarding, getProfile } from "@/lib/projects.functions";
import { dummyAvatars } from "@/lib/avatars";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Personalisasi akun — Nugasinaje" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardingPage,
});

const GENDERS = [
  { id: "male", label: "Laki-laki" },
  { id: "female", label: "Perempuan" },
  { id: "other", label: "Lainnya" },
];

const SEMESTER_OPTIONS = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6",
  "Semester 7",
  "Semester 8",
  "Semester 9+",
  "Pascasarjana",
];

function OnboardingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getFn = useServerFn(getProfile);
  const submitFn = useServerFn(completeOnboarding);
  const { data: profile, isLoading } = useQuery({ queryKey: ["profile"], queryFn: () => getFn() });

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [semester, setSemester] = useState("");
  const [gender, setGender] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (profile?.onboarded) {
      navigate({ to: "/" });
    }
    if (profile && !name) {
      setName(profile.name ?? "");
      setUniversity(profile.university ?? "");
      setMajor(profile.major ?? "");
      setSemester(profile.semester ?? "");
      setGender(profile.gender ?? "");
      setAvatarUrl(profile.avatar_url ?? null);
    }
  }, [profile, navigate, name]);

  const save = useMutation({
    mutationFn: () =>
      submitFn({
        data: {
          name: name.trim(),
          university: university.trim(),
          major: major.trim(),
          semester: semester.trim(),
          gender,
          avatar_url: avatarUrl,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("onboarding_skipped");
      }
      toast.success("Selamat datang di Nugasinaje!");
      navigate({ to: "/" });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Gagal menyimpan"),
  });

  async function handleFile(file: File) {
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Ukuran maksimum 3MB");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = () => {
          img.onload = () => {
            const size = 256;
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d")!;
            const min = Math.min(img.width, img.height);
            const sx = (img.width - min) / 2;
            const sy = (img.height - min) / 2;
            ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
            resolve(canvas.toDataURL("image/jpeg", 0.82));
          };
          img.onerror = reject;
          img.src = reader.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setAvatarUrl(dataUrl);
    } catch {
      toast.error("Gagal memproses foto");
    } finally {
      setUploading(false);
    }
  }

  // Steps: 0 Nama · 1 Jenis kelamin · 2 Universitas · 3 Jurusan · 4 Semester · 5 Avatar
  const totalSteps = 6;
  const canNext =
    step === 0
      ? name.trim().length >= 2
      : step === 1
        ? gender !== ""
        : step === 2
          ? university.trim().length >= 2
          : step === 3
            ? major.trim().length >= 2
            : step === 4
              ? semester.trim().length >= 1
              : true;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF6EC]">
        <Loader2 className="h-6 w-6 animate-spin text-[#1B2A4A]" />
      </div>
    );
  }

  const stepTitles = [
    { title: "Kenalan dulu, yuk", sub: "Kami akan menyapamu di dashboard." },
    { title: "Sedikit tentang kamu", sub: "Bantu kami memanggilmu dengan tepat." },
    { title: "Kampus atau instansi", sub: "Muncul di header dokumen yang kamu buat." },
    { title: "Jurusan / program studi", sub: "AI akan menyesuaikan istilah dengan bidangmu." },
    { title: "Semester saat ini", sub: "Menyesuaikan kedalaman & referensi." },
    { title: "Pilih foto profilmu", sub: "Pilih avatar bawaan atau unggah fotomu sendiri." },
  ];

  return (
    <div className="min-h-screen bg-[#FAF6EC] px-6 py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B2A4A] text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="font-semibold text-[#1B2A4A]" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem" }}>
            Nugasin<span style={{ color: "#C9A44C" }}>aje</span>
          </span>
        </div>

        {/* Progress */}
        <div className="mb-6 flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E7E1D2]">
              <div
                className="h-full bg-[#1B2A4A] transition-all"
                style={{ width: i <= step ? "100%" : "0%" }}
              />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border-2 border-[#1B2A4A]/10 bg-white p-8 shadow-[0_10px_40px_-15px_rgba(27,42,74,0.25)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A44C]">
            Langkah {step + 1} dari {totalSteps}
          </p>
          <h1
            className="mt-2 text-2xl font-semibold text-[#1B2A4A]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {stepTitles[step].title}
          </h1>
          <p className="mt-1 text-sm text-[#55524C]">{stepTitles[step].sub}</p>

          <div className="mt-6 space-y-4">
            {step === 0 && (
              <OField
                label="Nama lengkap"
                value={name}
                onChange={setName}
                placeholder="Contoh: Rina Kartika"
              />
            )}

            {step === 1 && (
              <div>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#1B2A4A]/70">
                  Jenis kelamin
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {GENDERS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGender(g.id)}
                      className={`rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all ${
                        gender === g.id
                          ? "border-[#1B2A4A] bg-[#1B2A4A] text-white shadow-md"
                          : "border-[#1B2A4A]/15 bg-white text-[#1B2A4A] hover:border-[#1B2A4A]/40"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <OField
                label="Universitas / Instansi"
                value={university}
                onChange={setUniversity}
                placeholder="Contoh: Universitas Indonesia"
              />
            )}

            {step === 3 && (
              <OField
                label="Jurusan / Program Studi"
                value={major}
                onChange={setMajor}
                placeholder="Contoh: Ilmu Komunikasi"
              />
            )}

            {step === 4 && (
              <div>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#1B2A4A]/70">
                  Semester
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {SEMESTER_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSemester(s)}
                      className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                        semester === s
                          ? "border-[#1B2A4A] bg-[#1B2A4A] text-white shadow-md"
                          : "border-[#1B2A4A]/15 bg-white text-[#1B2A4A] hover:border-[#1B2A4A]/40"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <div className="grid grid-cols-4 gap-3">
                  {dummyAvatars.map((a) => {
                    const active = avatarUrl === a.url;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setAvatarUrl(a.url)}
                        aria-label={a.label}
                        className={`relative aspect-square overflow-hidden rounded-full transition-transform ${
                          active
                            ? "scale-110 ring-4 ring-[#C9A44C] ring-offset-2 ring-offset-white"
                            : "ring-1 ring-[#1B2A4A]/10 hover:scale-105"
                        }`}
                      >
                        <img src={a.url} alt={a.label} className="h-full w-full object-cover" />
                        {active && (
                          <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#C9A44C] text-white shadow">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex aspect-square flex-col items-center justify-center gap-0.5 rounded-full border-2 border-dashed border-[#1B2A4A]/30 text-[#55524C] transition-colors hover:border-[#1B2A4A] hover:text-[#1B2A4A] disabled:opacity-50"
                    aria-label="Unggah foto"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <span className="text-[9px] font-medium">Unggah</span>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                      e.target.value = "";
                    }}
                  />
                </div>
                {avatarUrl && (
                  <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#FAF6EC] p-3">
                    <img src={avatarUrl} alt="preview" className="h-10 w-10 rounded-full object-cover" />
                    <p className="text-xs text-[#55524C]">Foto profil siap disimpan.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                if (step === 0) {
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem("onboarding_skipped", "1");
                  }
                  navigate({ to: "/" });
                } else {
                  setStep(step - 1);
                }
              }}
              className="text-sm font-medium text-[#55524C] hover:text-[#1B2A4A]"
            >
              {step === 0 ? "Nanti saja" : "Kembali"}
            </button>
            {step < totalSteps - 1 ? (
              <button
                type="button"
                disabled={!canNext}
                onClick={() => setStep(step + 1)}
                className="rounded-lg bg-[#1B2A4A] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-40 disabled:hover:translate-y-0"
              >
                Lanjut
              </button>
            ) : (
              <button
                type="button"
                disabled={save.isPending}
                onClick={() => save.mutate()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
              >
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Selesai
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1B2A4A]/70">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border-2 border-[#1B2A4A]/15 bg-white px-4 py-2.5 text-sm text-[#1B2A4A] placeholder:text-[#55524C]/50 focus:border-[#1B2A4A] focus:outline-none focus:ring-4 focus:ring-[#1B2A4A]/10"
      />
    </label>
  );
}