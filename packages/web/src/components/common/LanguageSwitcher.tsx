import { Globe } from "lucide-react";
import { useI18n, type SupportedLanguage } from "../../i18n";

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
}

const LABEL_BY_LANGUAGE: Record<SupportedLanguage, string> = {
  en: "common.english",
  "pt-BR": "common.portugueseBrazil",
};

export function LanguageSwitcher({ className = "", compact = false }: LanguageSwitcherProps) {
  const { language, setLanguage, supportedLanguages, t } = useI18n();

  return (
    <label className={`inline-flex items-center gap-2 ${className}`}>
      <Globe className="h-3.5 w-3.5 text-neutral-fg3" />
      {!compact && <span className="text-[11px] text-neutral-fg2">{t("common.language")}</span>}
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as SupportedLanguage)}
        aria-label={t("common.language")}
        className="h-[30px] rounded-lg border border-stroke bg-neutral-bg2 px-2 text-[11px] text-neutral-fg1 focus:outline-none focus:ring-2 focus:ring-brand-light"
      >
        {supportedLanguages.map((candidate) => (
          <option key={candidate} value={candidate}>
            {t(LABEL_BY_LANGUAGE[candidate])}
          </option>
        ))}
      </select>
    </label>
  );
}
