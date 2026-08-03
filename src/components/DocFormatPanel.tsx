import { useState } from "react";
import { ChevronDown, FileCog } from "lucide-react";
import {
  DOC_PRESETS,
  FONT_OPTIONS,
  SIZE_OPTIONS,
  SPACING_OPTIONS,
  readDocFormat,
  writeDocFormat,
  type DocFormat,
} from "@/lib/doc-format";
import { useT } from "@/lib/i18n";

/**
 * Panel pengaturan format dokumen (preset kampus + opsi kustom).
 * Nilai disimpan ke `answers` proyek lewat callback onChange.
 */
export function DocFormatPanel({
  answers,
  onChange,
}: {
  answers: Record<string, string>;
  onChange: (patch: Record<string, string>) => void;
}) {
  const { t, lang } = useT();
  const fmt = readDocFormat(answers);
  const [open, setOpen] = useState(false);

  function update(next: Partial<DocFormat>) {
    onChange(writeDocFormat({ ...fmt, ...next }));
  }

  function pickPreset(preset: string) {
    if (preset === "custom") {
      onChange(writeDocFormat({ ...fmt, preset: "custom" }));
      setOpen(true);
      return;
    }
    onChange(writeDocFormat({ preset, ...DOC_PRESETS[preset].value }));
  }

  const isCustom = fmt.preset === "custom";
  const presetLabel = (key: string) =>
    lang === "en" ? DOC_PRESETS[key].labelEn : DOC_PRESETS[key].label;

  return (
    <div className="space-y-2 rounded-xl border border-border bg-background p-3">
      <div className="flex items-center gap-2">
        <FileCog className="h-3.5 w-3.5 text-foreground" />
        <span className="text-xs font-medium text-foreground">{t("format.title")}</span>
      </div>
      <p className="text-[11px] text-muted-foreground">{t("format.hint")}</p>

      <label className="block">
        <span className="sr-only">{t("format.preset")}</span>
        <select
          value={fmt.preset}
          onChange={(e) => pickPreset(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-xs text-foreground focus:border-foreground/30 focus:outline-none"
        >
          {Object.keys(DOC_PRESETS).map((key) => (
            <option key={key} value={key}>
              {presetLabel(key)}
            </option>
          ))}
        </select>
      </label>

      {!isCustom && (
        <p className="text-[11px] text-muted-foreground">
          {fmt.font} {fmt.fontSize}pt · {t("format.spacing")} {fmt.lineSpacing} ·{" "}
          {t("format.margin")} {fmt.marginTop}-{fmt.marginLeft}-{fmt.marginRight}-
          {fmt.marginBottom} cm
        </p>
      )}

      {isCustom && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-medium text-foreground"
          >
            {t("format.advanced")}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Select
                  label={t("format.font")}
                  value={fmt.font}
                  options={FONT_OPTIONS.map((f) => [f, f])}
                  onChange={(v) => update({ font: v })}
                />
                <Select
                  label={t("format.size")}
                  value={String(fmt.fontSize)}
                  options={SIZE_OPTIONS.map((s) => [String(s), `${s} pt`])}
                  onChange={(v) => update({ fontSize: Number(v) })}
                />
                <Select
                  label={t("format.spacing")}
                  value={String(fmt.lineSpacing)}
                  options={SPACING_OPTIONS.map((s) => [String(s), String(s)])}
                  onChange={(v) => update({ lineSpacing: Number(v) })}
                />
                <Select
                  label={t("format.cover")}
                  value={fmt.cover}
                  options={[
                    ["kampus", t("format.cover.kampus")],
                    ["minimalis", t("format.cover.minimalis")],
                    ["tanpa", t("format.cover.tanpa")],
                  ]}
                  onChange={(v) => update({ cover: v as DocFormat["cover"] })}
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <NumberField label={t("format.top")} value={fmt.marginTop} onChange={(v) => update({ marginTop: v })} />
                <NumberField label={t("format.left")} value={fmt.marginLeft} onChange={(v) => update({ marginLeft: v })} />
                <NumberField label={t("format.right")} value={fmt.marginRight} onChange={(v) => update({ marginRight: v })} />
                <NumberField label={t("format.bottom")} value={fmt.marginBottom} onChange={(v) => update({ marginBottom: v })} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground focus:border-foreground/30 focus:outline-none"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        type="number"
        min={1}
        max={6}
        step={0.1}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n) && n > 0) onChange(n);
        }}
        className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground focus:border-foreground/30 focus:outline-none"
      />
    </label>
  );
}
