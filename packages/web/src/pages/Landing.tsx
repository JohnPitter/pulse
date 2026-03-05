import { Link } from "react-router-dom";
import {
  Bot,
  BriefcaseBusiness,
  FileStack,
  MessageSquare,
  Puzzle,
  SquareCheckBig,
  ArrowRight,
} from "lucide-react";
import { LanguageSwitcher } from "../components/common/LanguageSwitcher";
import { PulseLogo } from "../components/brand/PulseLogo";
import { useI18n } from "../i18n";
import { useAuthStore } from "../stores/auth";

const FEATURE_CARDS = [
  { titleKey: "nav.agents", icon: Bot, descriptionKey: "landing.featureAgents" },
  { titleKey: "dashboard.task", icon: SquareCheckBig, descriptionKey: "landing.featureTasks" },
  { titleKey: "nav.projects", icon: BriefcaseBusiness, descriptionKey: "landing.featureProjects" },
  { titleKey: "nav.skillsPlugins", icon: Puzzle, descriptionKey: "landing.featureSkills" },
  { titleKey: "nav.chat", icon: MessageSquare, descriptionKey: "landing.featureChat" },
  { titleKey: "nav.files", icon: FileStack, descriptionKey: "landing.featureFiles" },
] as const;

const HOW_IT_WORKS_KEYS = ["landing.step1", "landing.step2", "landing.step3", "landing.step4", "landing.step5"] as const;

const IMAGE_SECTIONS = [
  {
    titleKey: "landing.imageCard1Title",
    textKey: "landing.imageCard1Text",
    src: "/images/home-live-orchestration.svg",
    alt: "Agents activity feed with running tasks",
  },
  {
    titleKey: "landing.imageCard2Title",
    textKey: "landing.imageCard2Text",
    src: "/images/home-execution-evidence.svg",
    alt: "Last task execution details and logs",
  },
  {
    titleKey: "landing.imageCard3Title",
    textKey: "landing.imageCard3Text",
    src: "/images/home-decision-dashboard.svg",
    alt: "Tasks by status analytics and completion metrics",
  },
] as const;

export function Landing() {
  const { t } = useI18n();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="min-h-screen w-full bg-[#2E2E31]">
      <div className="min-h-screen w-full border border-black/10 bg-[#E7E5E2] p-4 sm:p-6 animate-fade-in">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-stroke bg-neutral-bg2 text-[14px] font-semibold text-neutral-fg1">
              <PulseLogo className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-neutral-fg1">{t("common.productName")}</p>
              <p className="text-[11px] text-neutral-fg3">{t("landing.productSubtitle")}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <Link
              to={isAuthenticated ? "/settings" : "/login"}
              className="rounded-xl border border-stroke bg-neutral-bg2 px-3 py-1.5 text-[12px] text-neutral-fg2 hover:bg-neutral-bg3"
            >
              {isAuthenticated ? t("topbar.settings") : t("landing.signIn")}
            </Link>
            <Link
              to="/demo"
              className="rounded-xl bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-brand-hover"
            >
              {t("landing.viewDemo")}
            </Link>
          </div>
        </header>

        <section className="mb-4 grid gap-3 xl:grid-cols-[0.56fr_0.44fr]">
          <div className="rounded-[20px] border border-black/6 bg-[#F1EFEC] p-6 shadow-[0_8px_18px_rgba(0,0,0,0.06)] animate-fade-up stagger-1">
            <p className="mb-2 inline-flex items-center rounded-full border border-stroke bg-neutral-bg2 px-2.5 py-1 text-[10px] text-neutral-fg2">
              {t("landing.heroBadge")}
            </p>
            <h1 className="text-[42px] font-semibold tracking-[-0.03em] text-neutral-fg1">
              {t("landing.heroTitle")}
            </h1>
            <p className="mt-3 max-w-[48ch] text-[14px] text-neutral-fg2">
              {t("landing.heroDescription")}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                to="/app/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-hover"
              >
                {t("landing.getStarted")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/demo"
                className="rounded-xl border border-stroke bg-neutral-bg2 px-4 py-2 text-[13px] text-neutral-fg2 hover:bg-neutral-bg3"
              >
                {t("landing.viewDemo")}
              </Link>
            </div>
          </div>

          <div className="rounded-[20px] border border-black/6 bg-[#F1EFEC] p-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)] animate-fade-up stagger-2">
            <div className="mb-3 rounded-2xl border border-black/5 bg-[#ECE9E4] p-3">
              <p className="text-[12px] font-semibold text-neutral-fg1">{t("landing.dashboardPreview")}</p>
              <p className="text-[10px] text-neutral-fg3">{t("landing.dashboardPreviewSubtitle")}</p>
            </div>

            <div className="grid gap-2 md:grid-cols-[0.68fr_0.32fr]">
              <img
                src="/images/home-hero-dashboard.svg"
                alt="Pulse dashboard with Backlog, Tasks by status, Agents activity and Last task cards"
                className="h-[232px] w-full rounded-2xl border border-black/5 bg-[#ECE9E4] object-contain p-1.5 animate-float-soft"
                loading="eager"
              />
              <div className="grid gap-2">
                <img
                  src="/images/home-preview-status.svg"
                  alt="Tasks by status preview"
                  className="h-[112px] w-full rounded-2xl border border-black/5 bg-[#ECE9E4] object-contain p-1"
                />
                <img
                  src="/images/home-preview-last-task.svg"
                  alt="Last task preview"
                  className="h-[112px] w-full rounded-2xl border border-black/5 bg-[#ECE9E4] object-contain p-1"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mb-4 rounded-[20px] border border-black/6 bg-[#F1EFEC] p-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)] animate-fade-up stagger-3">
          <p className="mb-3 inline-flex items-center rounded-full border border-stroke bg-neutral-bg2 px-2.5 py-1 text-[10px] text-neutral-fg2">
            {t("landing.trustBadge")}
          </p>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
            {IMAGE_SECTIONS.map((section) => (
              <article key={section.titleKey} className="overflow-hidden rounded-2xl border border-black/5 bg-[#ECE9E4]">
                <img src={section.src} alt={section.alt} className="h-[148px] w-full bg-[#E8E5E0] object-contain p-1.5" loading="lazy" />
                <div className="p-3">
                  <p className="text-[13px] font-semibold text-neutral-fg1">{t(section.titleKey)}</p>
                  <p className="mt-1 text-[11px] text-neutral-fg2">{t(section.textKey)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="features" className="mb-4 rounded-[20px] border border-black/6 bg-[#F1EFEC] p-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)] animate-fade-up stagger-4">
          <div className="mb-3">
            <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-neutral-fg1">{t("landing.featuresTitle")}</h2>
            <p className="text-[12px] text-neutral-fg2">{t("landing.featuresSubtitle")}</p>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {FEATURE_CARDS.map((feature) => (
              <article key={feature.titleKey} className="rounded-2xl border border-black/5 bg-[#ECE9E4] p-3 transition-transform duration-200 hover:-translate-y-0.5">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-stroke bg-neutral-bg2">
                  <feature.icon className="h-4 w-4 text-neutral-fg2" />
                </div>
                <p className="text-[13px] font-semibold text-neutral-fg1">{t(feature.titleKey)}</p>
                <p className="mt-1 text-[11px] text-neutral-fg2">{t(feature.descriptionKey)}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="mb-4 rounded-[20px] border border-black/6 bg-[#F1EFEC] p-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)] animate-fade-up stagger-5">
          <div className="mb-3">
            <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-neutral-fg1">{t("landing.howItWorksTitle")}</h2>
            <p className="text-[12px] text-neutral-fg2">{t("landing.howItWorksSubtitle")}</p>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
            {HOW_IT_WORKS_KEYS.map((stepKey, index) => (
              <div key={stepKey} className="rounded-2xl border border-black/5 bg-[#ECE9E4] p-3">
                <p className="text-[10px] text-neutral-fg3">{t("landing.stepLabel", { step: index + 1 })}</p>
                <p className="text-[13px] font-semibold text-neutral-fg1">{t(stepKey)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[20px] border border-black/6 bg-[linear-gradient(140deg,#E4E1DC,#D8D4CE)] p-6 shadow-[0_8px_18px_rgba(0,0,0,0.06)] animate-fade-up">
          <p className="text-[28px] font-semibold tracking-[-0.02em] text-neutral-fg1">
            {t("landing.ctaTitle")}
          </p>
          <p className="mt-1 text-[13px] text-neutral-fg2">
            {t("landing.ctaText")}
          </p>
          <div className="mt-4">
            <Link
              to="/app/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-hover"
            >
              {t("landing.getStarted")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
