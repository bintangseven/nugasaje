import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "id" | "en";

type Dict = Record<string, string>;

const translations: Record<Lang, Dict> = {
  id: {
    // Header
    "nav.home": "Beranda",
    "nav.dashboard": "Dashboard",
    "nav.projects": "Proyek",
    "nav.pricing": "Harga",
    "nav.faq": "FAQ",
    "nav.profile": "Profil",
    "nav.getStarted": "Mulai Sekarang",
    "menu.dashboard": "Dashboard",
    "menu.myProjects": "Proyek saya",
    "menu.editProfile": "Edit profil",
    "menu.signOut": "Keluar",
    "menu.university": "Universitas",
    "menu.major": "Jurusan",
    "menu.semester": "Semester",
    "menu.notFilled": "Belum diisi",

    // Hero
    "hero.badge": "AI Research Assistant",
    "hero.title1": "Makalah & PPT kelar ",
    "hero.title2": "dalam satu klik.",
    "hero.sub": "Pilih satu misi, jawab beberapa pertanyaan singkat, dan biarkan Numu AI menyusun struktur, isi, sampai daftar pustaka.",
    "hero.cta.start": "Mulai gratis",
    "hero.cta.how": "Lihat caranya",
    "hero.trust.secure": "Data tersimpan aman",
    "hero.trust.fast": "Hasil siap ≤ 3 menit",
    "hero.trust.noCC": "Tanpa kartu kredit",

    // Flow card
    "flow.eyebrow": "Alur proses",
    "flow.live": "LIVE",
    "flow.input": "Input Data",
    "flow.ai": "AI Analysis",
    "flow.output": "Output",
    "flow.headline": "Dari brief singkat ke file siap kumpul",
    "flow.stat.accuracy": "Akurasi",
    "flow.stat.students": "Mahasiswa",
    "flow.stat.rating": "Rating",
    "flow.stat.docs": "Dokumen",

    // Mini demo
    "demo.badge": "Coba langsung",
    "demo.title": "Tulis topikmu, lihat outline-nya sekarang",
    "demo.sub": "Tanpa daftar akun. Ketik topik singkat dan Numu AI menampilkan rangka bab beserta poin bahasannya.",
    "demo.placeholder": "Contoh: Pemasaran digital UMKM",
    "demo.button": "Buat draf outline",
    "demo.empty": "Hasil outline akan muncul di sini setelah kamu mengetik topik.",
    "demo.loading": "Menyusun outline…",
    "demo.resultFor": "Draf outline untuk",
    "demo.cta": "Lanjutkan jadi makalah utuh",
    "demo.ctaNote": "Gratis untuk proyek pertama.",

    // Contoh hasil
    "sample.eyebrow": "Contoh hasil nyata",
    "sample.title": "Lihat kerapian format sebelum mendaftar",
    "sample.sub": "Unduh contoh file asli yang dibuat memakai mesin format yang sama: margin standar makalah, daftar pustaka, dan slide PowerPoint yang bisa diedit.",
    "sample.docx": "Unduh contoh .docx",
    "sample.pptx": "Unduh contoh .pptx",

    // Social proof
    "proof.eyebrow": "Bukti nyata",
    "proof.title": "Sudah dipakai mahasiswa dari berbagai kampus",
    "proof.docs": "Dokumen selesai dibuat",
    "proof.projects": "Proyek dikerjakan",
    "proof.students": "Mahasiswa terdaftar",
    "proof.t1": "Outline-nya langsung rapi, tinggal saya sesuaikan dengan arahan dosen. Hemat waktu banget saat deadline.",
    "proof.t1.author": "Mahasiswa S1 Manajemen — anonim",
    "proof.t2": "Format makalahnya sudah sesuai panduan kampus, jadi saya tidak perlu atur margin dan daftar isi manual.",
    "proof.t2.author": "Mahasiswa S1 Ilmu Komunikasi — anonim",
    "proof.t3": "Slide PPT-nya bisa diedit di PowerPoint, bukan gambar. Itu yang bikin saya balik lagi.",
    "proof.t3.author": "Mahasiswa D3 Akuntansi — anonim",

    // Missions section
    "missions.eyebrow": "Research tools Terpercaya",
    "missions.title": "Dari topik kosong sampai file siap kumpul",
    "missions.paper": "Paper Research",
    "missions.presentation": "Presentation",
    "missions.citation.title": "Citation Finder",
    "missions.citation.desc": "Cari, validasi, dan format sitasi APA/IEEE otomatis dari jurnal terpercaya pasca-2020.",
    "missions.citation.soon": "Segera hadir",
    "missions.citation.output": "Output: BibTeX / .docx",
    "missions.comingSoon": "Coming soon",

    // How it works
    "how.eyebrow": "Cara memulai",
    "how.title": "Tiga langkah, satu file siap kumpul",
    "how.sub": "Tidak perlu prompt panjang. Cukup jawab pertanyaan singkat, sisanya AI yang kerjakan.",
    "how.step": "Langkah",
    "how.s1.title": "Pilih misi",
    "how.s1.desc": "Tentukan apakah kamu butuh makalah atau presentasi. Satu klik, satu alur.",
    "how.s2.title": "Isi brief singkat",
    "how.s2.desc": "Jawab beberapa pertanyaan: topik, gaya, jumlah bab/slide, dan referensi.",
    "how.s3.title": "Unduh hasilnya",
    "how.s3.desc": "AI menyusun struktur, isi, dan daftar pustaka. Tinggal unduh .docx / .pptx.",

    // Recent
    "recent.eyebrow": "Riwayat",
    "recent.title": "Proyek Terbaru",
    "recent.sub": "Tersinkron otomatis di seluruh perangkatmu.",
    "recent.viewAll": "Lihat semua →",
    "recent.empty": "Belum ada proyek. Mulai misi di atas untuk membuat yang pertama.",

    // CTA
    "cta.eyebrow": "Siap mulai?",
    "cta.title": "Deadline besok?",
    "cta.titleStrong": "Mulai sekarang.",
    "cta.desc": "Pilih satu misi, jawab brief singkat, dan biarkan Numu AI yang lembur. Gratis untuk dicoba — tanpa kartu kredit.",
    "cta.button": "Mulai misi pertama",
    "cta.pro": "Lihat paket Pro →",

    // Footer
    "footer.tagline": "Platform AI cerdas yang membantu mahasiswa dan peneliti di seluruh dunia meningkatkan kualitas akademik dengan teknologi masa depan.",
    "footer.products": "Produk",
    "footer.resources": "Sumber",
    "footer.legal": "Legal",
    "footer.contact": "Kontak",
    "footer.terms": "Syarat layanan",
    "footer.privacy": "Kebijakan privasi",
    "footer.rights": "Empowering academic excellence.",
    "footer.version": "v1.0 — Intelligent Academic Ledger",
    "footer.disclaimer": "Konten dihasilkan oleh AI dan bisa mengandung kesalahan atau data yang kurang akurat. Selalu periksa ulang fakta, sitasi, dan referensi sebelum diserahkan.",
    "footer.disclaimerLabel": "Disclaimer:",

    // Language switcher
    "lang.label": "Bahasa",

    // Mission workspace
    "mission.back": "Kembali ke proyek",
    "mission.timeLeft": "Sisa waktu",
    "mission.done": "Selesai",
    "mission.downloadDocx": "Unduh .docx",
    "mission.docPreview": "Dokumen Word",
    "mission.slidePreview": "Slide PowerPoint",
    "mission.preview": "Preview",
    "mission.assistant": "Asisten Numu",
    "mission.aiActivity": "Aktivitas AI",
    "mission.saving": "Menyimpan…",
    "mission.saved": "Tersimpan",
    "mission.syncFail": "Gagal menyimpan",
    "mission.sync": "Sinkron",
    "mission.readyToStart": "Aku punya semua yang aku butuhkan. Klik Mulai kerjakan dan aku akan menyusun karyamu.",
    "mission.working": "Sedang aku kerjakan. Kamu bisa rebahan sebentar 🌿",
    "mission.finished": "Selesai! File siap diunduh dan diedit.",
    "mission.questionOf": "Pertanyaan",
    "mission.of": "dari",
    "mission.next": "Lanjut",
    "mission.attachOptional": "Lampiran (opsional)",
    "mission.attachHint": "Unggah materi referensi (PDF, TXT, MD, atau gambar, maks 10MB). AI akan menjadikannya bahan utama.",
    "mission.pickFile": "Pilih file",
    "mission.removeAttach": "Hapus lampiran",
    "mission.workingHint": "Sedang dikerjakan AI… kamu bebas menutup halaman ini.",
    "mission.rerun": "Jalankan ulang jika macet",
    "mission.start": "Mulai kerjakan",
    "mission.emptyPreview": "Preview akan muncul di sini saat aku mulai menyusun.",
    "mission.loading": "Memuat proyek…",
    "mission.notFound": "Proyek tidak ditemukan",

    // Preset format dokumen
    "format.title": "Format dokumen",
    "format.hint": "Pilih preset format kampus atau atur sendiri margin, font, dan spasi.",
    "format.preset": "Preset",
    "format.advanced": "Pengaturan lanjutan",
    "format.font": "Font",
    "format.size": "Ukuran",
    "format.spacing": "Spasi",
    "format.margin": "Margin",
    "format.top": "Atas",
    "format.left": "Kiri",
    "format.right": "Kanan",
    "format.bottom": "Bawah",
    "format.cover": "Cover",
    "format.cover.kampus": "Standar kampus",
    "format.cover.minimalis": "Minimalis",
    "format.cover.tanpa": "Tanpa cover",

    // Assistant tips
    "tips.title": "Tips dari Asisten Numu",
    "tips.from": "Asisten Numu",
    "tips.open": "Tips",
    "tips.for": "Tips untuk proyek ini",
    "tips.close": "Tutup tips",
    "tips.next": "Tips lain",
    "tips.gotIt": "Mengerti",
    "tips.paper.1": "Topik yang spesifik menghasilkan paper lebih fokus. Hindari topik yang terlalu luas.",
    "tips.paper.2": "Gunakan lampiran PDF/TXT untuk memberikan materi dasar agar AI menyesuaikan gaya bahasamu.",
    "tips.paper.3": "Tambahkan keterangan di kolom Catatan untuk arahan khusus, misalnya gaya bahasa atau sumber yang diinginkan.",
    "tips.paper.4": "Sitasi otomatis sudah disetel pasca-2020. Selalu periksa ulang referensi sebelum pengumpulan.",
    "tips.presentation.1": "Slide paling efektif menggabungkan narasi paragraf 50% + bullet 50%. Jangan hanya poin-poin kering.",
    "tips.presentation.2": "Jelaskan target audiens di kolom Catatan agar AI menyesuaikan kedalaman materi.",
    "tips.presentation.3": "AI akan mencari gambar Unsplash berbahasa Inggris. Deskripsikan visual yang diinginkan secara spesifik.",
    "tips.presentation.4": "Jumlah slide ideal 8–15. Terlalu sedikit kurang informatif, terlalu banyak membosankan audiens.",

    // Dashboard
    "dash.welcome": "Selamat Datang Kembali,",
    "dash.openProfile": "Buka profil",
    "dash.newPaper": "Paper baru",
    "dash.newPpt": "PPT baru",
    "dash.upgradePro": "Upgrade Pro",
    "dash.quotaToday": "Kuota hari ini",
    "dash.quotaLeft": "Sisa {n} generate. Reset otomatis besok.",
    "dash.quotaOut": "Kuota habis. Upgrade PRO untuk 10 generate/hari.",
    "dash.savedProjects": "Proyek tersimpan",
    "dash.atCap": "Batas maksimum tercapai. Hapus proyek lama untuk membuat yang baru.",
    "dash.runningDone": "{a} berjalan · {b} selesai",
    "dash.avgProgress": "Rata-rata progres",
    "dash.nearest": "Paling dekat selesai: “{name}” ({p}%)",
    "dash.noProjectYet": "Mulai proyek pertama untuk melihat progres.",
    "dash.notStarted": "Semua proyek belum dimulai.",
    "dash.planPro": "Paket PRO",
    "dash.planBasic": "Paket Basic",
    "dash.thanks": "Terima kasih!",
    "dash.upgradeToPro": "Upgrade ke PRO",
    "dash.activeUntil": "Aktif sampai {date}.",
    "dash.proPitch": "10 generate/hari, prioritas antrian. Rp50rb/bulan.",
    "dash.manageProfile": "Kelola profil",
    "dash.upgradeNow": "Upgrade sekarang",
    "dash.createdWeek": "Dibuat 7 hari terakhir",
    "dash.updatedWeek": "Diperbarui 7 hari terakhir",
    "dash.doneTotal": "Selesai total",
    "dash.yourProjects": "Proyek kamu",
    "dash.continue": "Lanjutkan yang tertunda",
    "dash.viewAll": "Lihat semua →",
    "dash.searchPlaceholder": "Cari nama proyek…",
    "dash.all": "Semua",
    "dash.paper": "Paper",
    "dash.ppt": "PPT",
    "dash.status": "Status",
    "dash.active": "Aktif",
    "dash.done": "Selesai",
    "dash.sortRecent": "Terbaru",
    "dash.sortProgress": "Progres",
    "dash.sortName": "Nama A-Z",
    "dash.emptyProjects": "Belum ada proyek. Mulai dari tombol Paper baru atau PPT baru di atas.",
    "dash.noMatch": "Tidak ada proyek yang cocok dengan filter.",
    "dash.resetFilter": "Reset filter",
    "dash.viewMore": "Lihat {n} lainnya",
    "dash.viewMoreProjects": "Lihat {n} proyek lainnya",
    "dash.openAll": "Buka semua proyek",
    "dash.addProject": "Tambah proyek",
    "dash.slotsLeft": "{n} slot tersisa",
    "dash.prev": "Sebelumnya",
    "dash.next": "Selanjutnya",
    "dash.open": "Buka",
    "dash.pin": "Sematkan",
    "dash.unpin": "Lepas pin",
    "dash.presentation": "Presentasi",
    "dash.capReached": "Batas 15 proyek tercapai. Hapus proyek lama dulu.",
    "dash.createFail": "Gagal membuat proyek",
    "dash.student": "Mahasiswa",
    "card.actions": "Aksi proyek",
    "card.rename": "Ubah nama",
    "card.duplicate": "Duplikasi",
    "card.delete": "Hapus",
    "card.download": "Unduh",
    "card.openProject": "Buka proyek",
    "card.continue": "Lanjutkan",
    "card.deleteTitle": "Hapus proyek ini?",
    "card.deleteDesc": "Proyek “{name}” akan dihapus selamanya beserta seluruh jawaban dan hasilnya. Tindakan ini tidak bisa dibatalkan.",
    "card.cancel": "Batal",
    "card.deleting": "Menghapus…",
    "card.deleteForever": "Hapus selamanya",
    "card.renameTitle": "Ubah nama proyek",
    "card.projectName": "Nama proyek",
    "card.saving": "Menyimpan…",
    "card.save": "Simpan",
    "card.deleted": "Proyek dihapus",
    "card.deleteFail": "Gagal menghapus proyek",
    "card.duplicated": "Proyek diduplikasi",
    "card.duplicateFail": "Gagal menduplikasi",
    "card.renamed": "Nama diperbarui",
    "card.renameFail": "Gagal mengubah nama",
    "card.downloadFail": "Gagal mengunduh file",
  },
  en: {
    // Header
    "nav.home": "Home",
    "nav.dashboard": "Dashboard",
    "nav.projects": "Projects",
    "nav.pricing": "Pricing",
    "nav.faq": "FAQ",
    "nav.profile": "Profile",
    "nav.getStarted": "Get Started",
    "menu.dashboard": "Dashboard",
    "menu.myProjects": "My projects",
    "menu.editProfile": "Edit profile",
    "menu.signOut": "Sign out",
    "menu.university": "University",
    "menu.major": "Major",
    "menu.semester": "Semester",
    "menu.notFilled": "Not set",

    // Hero
    "hero.badge": "AI Research Assistant",
    "hero.title1": "Papers & slides done ",
    "hero.title2": "in one click.",
    "hero.sub": "Pick a mission, answer a few quick questions, and let Numu AI craft the structure, content, and references for you.",
    "hero.cta.start": "Start free",
    "hero.cta.how": "See how",
    "hero.trust.secure": "Your data stays safe",
    "hero.trust.fast": "Ready in ≤ 3 minutes",
    "hero.trust.noCC": "No credit card required",

    // Flow card
    "flow.eyebrow": "Process flow",
    "flow.live": "LIVE",
    "flow.input": "Input Data",
    "flow.ai": "AI Analysis",
    "flow.output": "Output",
    "flow.headline": "From a short brief to a ready-to-submit file",
    "flow.stat.accuracy": "Accuracy",
    "flow.stat.students": "Students",
    "flow.stat.rating": "Rating",
    "flow.stat.docs": "Documents",

    // Mini demo
    "demo.badge": "Try it now",
    "demo.title": "Type your topic, see the outline instantly",
    "demo.sub": "No sign-up needed. Enter a short topic and Numu AI shows a chapter outline with talking points.",
    "demo.placeholder": "Example: Digital marketing for MSMEs",
    "demo.button": "Generate draft outline",
    "demo.empty": "Your outline preview will appear here once you enter a topic.",
    "demo.loading": "Drafting the outline…",
    "demo.resultFor": "Draft outline for",
    "demo.cta": "Turn it into a full paper",
    "demo.ctaNote": "Free for your first project.",

    // Live samples
    "sample.eyebrow": "Real sample output",
    "sample.title": "Check the formatting before you sign up",
    "sample.sub": "Download real files built with the very same formatting engine: academic margins, reference list, and fully editable PowerPoint slides.",
    "sample.docx": "Download sample .docx",
    "sample.pptx": "Download sample .pptx",

    // Social proof
    "proof.eyebrow": "Real usage",
    "proof.title": "Already used by students across campuses",
    "proof.docs": "Documents completed",
    "proof.projects": "Projects worked on",
    "proof.students": "Registered students",
    "proof.t1": "The outline came out clean right away — I only tweaked it to match my lecturer's brief. Huge time saver.",
    "proof.t1.author": "Management undergraduate — anonymous",
    "proof.t2": "The paper formatting already matched my campus guide, so no manual margins or table of contents.",
    "proof.t2.author": "Communication undergraduate — anonymous",
    "proof.t3": "The PPT slides are editable in PowerPoint, not images. That is why I keep coming back.",
    "proof.t3.author": "Accounting diploma student — anonymous",

    // Missions
    "missions.eyebrow": "Trusted research tools",
    "missions.title": "From a blank topic to a ready-to-submit file",
    "missions.paper": "Paper Research",
    "missions.presentation": "Presentation",
    "missions.citation.title": "Citation Finder",
    "missions.citation.desc": "Find, verify, and format APA/IEEE citations automatically from trusted post-2020 journals.",
    "missions.citation.soon": "Coming soon",
    "missions.citation.output": "Output: BibTeX / .docx",
    "missions.comingSoon": "Coming soon",

    // How it works
    "how.eyebrow": "How to start",
    "how.title": "Three steps, one ready-to-submit file",
    "how.sub": "No long prompts needed. Just answer a few questions and let the AI handle the rest.",
    "how.step": "Step",
    "how.s1.title": "Pick a mission",
    "how.s1.desc": "Decide whether you need a paper or a presentation. One click, one flow.",
    "how.s2.title": "Fill a short brief",
    "how.s2.desc": "Answer a few questions: topic, tone, number of chapters/slides, and references.",
    "how.s3.title": "Download the result",
    "how.s3.desc": "The AI drafts the structure, content, and references. Just download .docx / .pptx.",

    // Recent
    "recent.eyebrow": "History",
    "recent.title": "Recent Projects",
    "recent.sub": "Synced automatically across your devices.",
    "recent.viewAll": "View all →",
    "recent.empty": "No projects yet. Start a mission above to create your first one.",

    // CTA
    "cta.eyebrow": "Ready to start?",
    "cta.title": "Deadline tomorrow?",
    "cta.titleStrong": "Start now.",
    "cta.desc": "Pick a mission, fill in a short brief, and let Numu AI pull the all-nighter. Free to try — no credit card needed.",
    "cta.button": "Start your first mission",
    "cta.pro": "See Pro plans →",

    // Footer
    "footer.tagline": "A smart AI platform helping students and researchers worldwide raise their academic quality with future-ready technology.",
    "footer.products": "Products",
    "footer.resources": "Resources",
    "footer.legal": "Legal",
    "footer.contact": "Contact",
    "footer.terms": "Terms of service",
    "footer.privacy": "Privacy policy",
    "footer.rights": "Empowering academic excellence.",
    "footer.version": "v1.0 — Intelligent Academic Ledger",
    "footer.disclaimer": "Content is generated by AI and may contain errors or inaccurate data. Always double-check facts, citations, and references before submitting.",
    "footer.disclaimerLabel": "Disclaimer:",

    // Language switcher
    "lang.label": "Language",

    // Mission workspace
    "mission.back": "Back to projects",
    "mission.timeLeft": "Time left",
    "mission.done": "Done",
    "mission.downloadDocx": "Download .docx",
    "mission.docPreview": "Word document",
    "mission.slidePreview": "PowerPoint slides",
    "mission.preview": "Preview",
    "mission.assistant": "Numu Assistant",
    "mission.aiActivity": "AI activity",
    "mission.saving": "Saving…",
    "mission.saved": "Saved",
    "mission.syncFail": "Failed to save",
    "mission.sync": "Synced",
    "mission.readyToStart": "I have everything I need. Click Start and I'll put your work together.",
    "mission.working": "Working on it. Feel free to relax 🌿",
    "mission.finished": "Done! Your file is ready to download and edit.",
    "mission.questionOf": "Question",
    "mission.of": "of",
    "mission.next": "Next",
    "mission.attachOptional": "Attachment (optional)",
    "mission.attachHint": "Upload reference material (PDF, TXT, MD, or image, up to 10MB). The AI will use it as the main source.",
    "mission.pickFile": "Pick a file",
    "mission.removeAttach": "Remove attachment",
    "mission.workingHint": "AI is working… you can safely close this page.",
    "mission.rerun": "Re-run if stuck",
    "mission.start": "Start",
    "mission.emptyPreview": "The preview will appear here once I start drafting.",
    "mission.loading": "Loading project…",
    "mission.notFound": "Project not found",

    // Assistant tips
    "tips.title": "Tips from Numu Assistant",
    "tips.from": "Numu Assistant",
    "tips.open": "Tips",
    "tips.for": "Tips for this project",
    "tips.close": "Close tips",
    "tips.next": "More tips",
    "tips.gotIt": "Got it",
    "tips.paper.1": "A specific topic produces a more focused paper. Avoid overly broad topics.",
    "tips.paper.2": "Upload PDF/TXT attachments to give the AI source material so it matches your writing style.",
    "tips.paper.3": "Use the Additional Notes field for special directions, such as tone or preferred sources.",
    "tips.paper.4": "Automatic citations are set to post-2020 sources. Always double-check references before submitting.",
    "tips.presentation.1": "The best slides mix 50% narrative paragraphs and 50% bullet points. Avoid dry lists only.",
    "tips.presentation.2": "Describe your target audience in the Notes field so the AI adjusts the depth of the material.",
    "tips.presentation.3": "The AI will search Unsplash using English queries. Describe the desired visuals specifically.",
    "tips.presentation.4": "The ideal slide count is 8–15. Too few slides lack information; too many bore the audience.",

    // Dashboard
    "dash.welcome": "Welcome back,",
    "dash.openProfile": "Open profile",
    "dash.newPaper": "New paper",
    "dash.newPpt": "New deck",
    "dash.upgradePro": "Upgrade Pro",
    "dash.quotaToday": "Today's quota",
    "dash.quotaLeft": "{n} generations left. Resets tomorrow.",
    "dash.quotaOut": "Quota used up. Upgrade to PRO for 10 generations/day.",
    "dash.savedProjects": "Saved projects",
    "dash.atCap": "Maximum reached. Delete an old project to create a new one.",
    "dash.runningDone": "{a} in progress · {b} done",
    "dash.avgProgress": "Average progress",
    "dash.nearest": "Closest to done: “{name}” ({p}%)",
    "dash.noProjectYet": "Start your first project to see progress.",
    "dash.notStarted": "No project has been started yet.",
    "dash.planPro": "PRO plan",
    "dash.planBasic": "Basic plan",
    "dash.thanks": "Thank you!",
    "dash.upgradeToPro": "Upgrade to PRO",
    "dash.activeUntil": "Active until {date}.",
    "dash.proPitch": "10 generations/day, priority queue. Rp50k/month.",
    "dash.manageProfile": "Manage profile",
    "dash.upgradeNow": "Upgrade now",
    "dash.createdWeek": "Created in last 7 days",
    "dash.updatedWeek": "Updated in last 7 days",
    "dash.doneTotal": "Completed total",
    "dash.yourProjects": "Your projects",
    "dash.continue": "Pick up where you left off",
    "dash.viewAll": "View all →",
    "dash.searchPlaceholder": "Search project name…",
    "dash.all": "All",
    "dash.paper": "Paper",
    "dash.ppt": "Deck",
    "dash.status": "Status",
    "dash.active": "Active",
    "dash.done": "Done",
    "dash.sortRecent": "Recent",
    "dash.sortProgress": "Progress",
    "dash.sortName": "Name A-Z",
    "dash.emptyProjects": "No projects yet. Start with the New paper or New deck button above.",
    "dash.noMatch": "No projects match the filters.",
    "dash.resetFilter": "Reset filters",
    "dash.viewMore": "View {n} more",
    "dash.viewMoreProjects": "View {n} more projects",
    "dash.openAll": "Open all projects",
    "dash.addProject": "Add project",
    "dash.slotsLeft": "{n} slots left",
    "dash.prev": "Previous",
    "dash.next": "Next",
    "dash.open": "Open",
    "dash.pin": "Pin",
    "dash.unpin": "Unpin",
    "dash.presentation": "Presentation",
    "dash.capReached": "You reached the 15-project limit. Delete an old project first.",
    "dash.createFail": "Failed to create project",
    "dash.student": "Student",
    "card.actions": "Project actions",
    "card.rename": "Rename",
    "card.duplicate": "Duplicate",
    "card.delete": "Delete",
    "card.download": "Download",
    "card.openProject": "Open project",
    "card.continue": "Continue",
    "card.deleteTitle": "Delete this project?",
    "card.deleteDesc": "The project “{name}” will be permanently deleted along with all answers and results. This cannot be undone.",
    "card.cancel": "Cancel",
    "card.deleting": "Deleting…",
    "card.deleteForever": "Delete permanently",
    "card.renameTitle": "Rename project",
    "card.projectName": "Project name",
    "card.saving": "Saving…",
    "card.save": "Save",
    "card.deleted": "Project deleted",
    "card.deleteFail": "Failed to delete project",
    "card.duplicated": "Project duplicated",
    "card.duplicateFail": "Failed to duplicate",
    "card.renamed": "Name updated",
    "card.renameFail": "Failed to rename",
    "card.downloadFail": "Failed to download file",
  },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (key: keyof typeof translations["id"]) => string };
const LangContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "numu.lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("id");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved === "id" || saved === "en") setLangState(saved);
    } catch {}
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l;
    } catch {}
  }, []);

  useEffect(() => {
    try { document.documentElement.lang = lang; } catch {}
  }, [lang]);

  const value = useMemo<Ctx>(() => ({
    lang,
    setLang,
    t: (key) => translations[lang][key] ?? translations.id[key] ?? String(key),
  }), [lang, setLang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useT() {
  const ctx = useContext(LangContext);
  if (!ctx) {
    // Fallback: return identity function when provider is missing (e.g. SSR safety)
    return {
      lang: "id" as Lang,
      setLang: (_: Lang) => {},
      t: (key: string) => translations.id[key] ?? key,
    };
  }
  return ctx;
}

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useT();
  const isID = lang === "id";
  return (
    <button
      type="button"
      onClick={() => setLang(isID ? "en" : "id")}
      className={`inline-flex items-center overflow-hidden rounded-full border border-outline-variant bg-surface-container-lowest text-[11px] font-bold tracking-wider ${className}`}
      aria-label={`Switch language, current ${lang.toUpperCase()}`}
      title="ID / EN"
    >
      <span
        className={`px-2.5 py-1 transition-colors ${isID ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface"}`}
      >
        ID
      </span>
      <span
        className={`px-2.5 py-1 transition-colors ${!isID ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface"}`}
      >
        EN
      </span>
    </button>
  );
}