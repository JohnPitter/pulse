import { Link } from "react-router-dom";
import { ArrowRight, Activity, ListChecks, ClipboardList } from "lucide-react";
import { PulseLogo } from "../components/brand/PulseLogo";
import { LanguageSwitcher } from "../components/common/LanguageSwitcher";
import { useI18n } from "../i18n";

const DEMO_POINTS = [
  {
    icon: ListChecks,
    titleKey: "demo.pointBacklogTitle",
    textKey: "demo.pointBacklogText",
  },
  {
    icon: Activity,
    titleKey: "demo.pointStatusTitle",
    textKey: "demo.pointStatusText",
  },
  {
    icon: ClipboardList,
    titleKey: "demo.pointExecutionTitle",
    textKey: "demo.pointExecutionText",
  },
] as const;

export function DemoPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen w-full bg-[#2E2E31]">
      <div className="min-h-screen w-full border border-black/10 bg-[#E7E5E2] p-4 sm:p-6 animate-fade-in">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-stroke bg-neutral-bg2">
              <PulseLogo className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-neutral-fg1">{t("common.productName")}</p>
              <p className="text-[11px] text-neutral-fg3">{t("demo.subtitle")}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <Link
              to="/"
              className="rounded-xl border border-stroke bg-neutral-bg2 px-3 py-1.5 text-[12px] text-neutral-fg2 hover:bg-neutral-bg3"
            >
              {t("demo.backToHome")}
            </Link>
            <Link
              to="/app/dashboard"
              className="rounded-xl bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-brand-hover"
            >
              {t("landing.openApp")}
            </Link>
          </div>
        </header>

        <section className="mb-4 rounded-[20px] border border-black/6 bg-[#F1EFEC] p-5 shadow-[0_8px_18px_rgba(0,0,0,0.06)] animate-fade-up stagger-1">
          <h1 className="text-[40px] font-semibold tracking-[-0.03em] text-neutral-fg1">{t("demo.title")}</h1>
          <p className="mt-2 max-w-[68ch] text-[14px] text-neutral-fg2">{t("demo.description")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/app/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-hover"
            >
              {t("demo.openDashboard")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-stroke bg-neutral-bg2 px-4 py-2 text-[13px] text-neutral-fg2 hover:bg-neutral-bg3"
            >
              {t("landing.signIn")}
            </Link>
          </div>
        </section>

        <section className="mb-4 grid gap-3 xl:grid-cols-[0.68fr_0.32fr] animate-fade-up stagger-2">
          <article className="rounded-[20px] border border-black/6 bg-[#F1EFEC] p-3 shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
            <img
              src="/images/home-hero-dashboard.svg"
              alt="Pulse dashboard demo"
              className="h-[420px] w-full rounded-2xl border border-black/5 bg-[#ECE9E4] object-contain p-2"
              loading="eager"
            />
          </article>

          <div className="grid gap-3">
            <article className="rounded-[20px] border border-black/6 bg-[#F1EFEC] p-3 shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
              <img
                src="/images/home-preview-status.svg"
                alt="Tasks by status preview"
                className="h-[202px] w-full rounded-2xl border border-black/5 bg-[#ECE9E4] object-contain p-2"
              />
            </article>
            <article className="rounded-[20px] border border-black/6 bg-[#F1EFEC] p-3 shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
              <img
                src="/images/home-preview-last-task.svg"
                alt="Last task preview"
                className="h-[202px] w-full rounded-2xl border border-black/5 bg-[#ECE9E4] object-contain p-2"
              />
            </article>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-3 animate-fade-up stagger-3">
          {DEMO_POINTS.map((point) => (
            <article key={point.titleKey} className="rounded-[20px] border border-black/6 bg-[#F1EFEC] p-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-stroke bg-neutral-bg2">
                <point.icon className="h-4 w-4 text-neutral-fg2" />
              </div>
              <p className="text-[14px] font-semibold text-neutral-fg1">{t(point.titleKey)}</p>
              <p className="mt-1 text-[12px] text-neutral-fg2">{t(point.textKey)}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
