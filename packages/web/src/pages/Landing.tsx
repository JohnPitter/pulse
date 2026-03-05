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

const FEATURE_CARDS = [
  { title: "Agents", icon: Bot, description: "Control agent pool, roles and execution states." },
  { title: "Tasks", icon: SquareCheckBig, description: "Plan, schedule and monitor operational tasks." },
  { title: "Projects", icon: BriefcaseBusiness, description: "Organize initiatives and align task boards." },
  { title: "Skills & Plugins", icon: Puzzle, description: "Attach capabilities and integrations per workspace." },
  { title: "Chat", icon: MessageSquare, description: "Coordinate with agents through focused threads." },
  { title: "Files", icon: FileStack, description: "Store artifacts and inspect outputs in one place." },
];

const HOW_IT_WORKS = [
  "Create project",
  "Add tasks",
  "Assign agents",
  "Run + monitor",
  "Review outputs",
];

export function Landing() {
  return (
    <div className="min-h-screen bg-[#2E2E31] p-4 sm:p-6">
      <div className="mx-auto max-w-[1240px] rounded-[24px] border border-black/10 bg-[#E7E5E2] p-4 shadow-[0_26px_70px_rgba(0,0,0,0.45)] sm:p-6">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-stroke bg-neutral-bg2 text-[14px] font-semibold text-neutral-fg1">
              P
            </div>
            <div>
              <p className="text-[15px] font-semibold text-neutral-fg1">Pulse</p>
              <p className="text-[11px] text-neutral-fg3">Operations cockpit</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-xl border border-stroke bg-neutral-bg2 px-3 py-1.5 text-[12px] text-neutral-fg2 hover:bg-neutral-bg3"
            >
              Sign in
            </Link>
            <Link
              to="/app/dashboard"
              className="rounded-xl bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-brand-hover"
            >
              Open app
            </Link>
          </div>
        </header>

        <section className="mb-4 grid gap-3 xl:grid-cols-[0.56fr_0.44fr]">
          <div className="rounded-[20px] border border-black/6 bg-[#F1EFEC] p-6 shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
            <p className="mb-2 inline-flex items-center rounded-full border border-stroke bg-neutral-bg2 px-2.5 py-1 text-[10px] text-neutral-fg2">
              Multi-agent operations
            </p>
            <h1 className="text-[42px] font-semibold tracking-[-0.03em] text-neutral-fg1">
              Keep every task, agent and project in one live control surface.
            </h1>
            <p className="mt-3 max-w-[48ch] text-[14px] text-neutral-fg2">
              Pulse unifies planning, execution and review with a compact dashboard shell built
              for day-to-day operations.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                to="/app/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-hover"
              >
                Get started
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <a
                href="#features"
                className="rounded-xl border border-stroke bg-neutral-bg2 px-4 py-2 text-[13px] text-neutral-fg2 hover:bg-neutral-bg3"
              >
                View demo
              </a>
            </div>
          </div>

          <div className="rounded-[20px] border border-black/6 bg-[#F1EFEC] p-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
            <div className="mb-3 rounded-2xl border border-black/5 bg-[#ECE9E4] p-3">
              <p className="text-[12px] font-semibold text-neutral-fg1">Dashboard preview</p>
              <p className="text-[10px] text-neutral-fg3">General overview</p>
            </div>
            <div className="grid gap-2 md:grid-cols-[0.45fr_0.55fr]">
              <div className="rounded-2xl border border-black/5 bg-[#ECE9E4] p-2">
                <div className="mb-2 h-[118px] rounded-xl border border-black/5 bg-[linear-gradient(180deg,#EEEAE5,#E2DFD9)]" />
                <div className="h-12 rounded-xl border border-black/5 bg-neutral-bg2" />
              </div>
              <div className="grid gap-2">
                <div className="h-[108px] rounded-2xl border border-black/5 bg-[#ECE9E4]" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-[70px] rounded-2xl border border-black/5 bg-[#ECE9E4]" />
                  <div className="h-[70px] rounded-2xl border border-black/5 bg-[#ECE9E4]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mb-4 rounded-[20px] border border-black/6 bg-[#F1EFEC] p-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
          <div className="mb-3">
            <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-neutral-fg1">Features</h2>
            <p className="text-[12px] text-neutral-fg2">Cards aligned with the app surface language.</p>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {FEATURE_CARDS.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-black/5 bg-[#ECE9E4] p-3">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-stroke bg-neutral-bg2">
                  <feature.icon className="h-4 w-4 text-neutral-fg2" />
                </div>
                <p className="text-[13px] font-semibold text-neutral-fg1">{feature.title}</p>
                <p className="mt-1 text-[11px] text-neutral-fg2">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="mb-4 rounded-[20px] border border-black/6 bg-[#F1EFEC] p-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
          <div className="mb-3">
            <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-neutral-fg1">How it works</h2>
            <p className="text-[12px] text-neutral-fg2">timeline/steps in minimal cards and chips.</p>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
            {HOW_IT_WORKS.map((step, index) => (
              <div key={step} className="rounded-2xl border border-black/5 bg-[#ECE9E4] p-3">
                <p className="text-[10px] text-neutral-fg3">Step {index + 1}</p>
                <p className="text-[13px] font-semibold text-neutral-fg1">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[20px] border border-black/6 bg-[linear-gradient(140deg,#E4E1DC,#D8D4CE)] p-6 shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
          <p className="text-[28px] font-semibold tracking-[-0.02em] text-neutral-fg1">
            Build your next workflow in Pulse.
          </p>
          <p className="mt-1 text-[13px] text-neutral-fg2">
            Start with the dashboard, then expand into projects, files and agent activity.
          </p>
          <div className="mt-4">
            <Link
              to="/app/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-hover"
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
