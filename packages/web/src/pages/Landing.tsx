import { Link } from "react-router-dom";
import { Terminal, Cpu, SplitSquareVertical, Activity, ArrowRight, ChevronRight } from "lucide-react";

const FEATURES = [
  {
    icon: Cpu,
    title: "Multi-Agent Management",
    description: "Create, configure, and monitor multiple Claude agents from a single dashboard.",
  },
  {
    icon: SplitSquareVertical,
    title: "Split View Terminal",
    description: "View two agent terminals side-by-side for parallel workflow monitoring.",
  },
  {
    icon: Activity,
    title: "Real-time Monitoring",
    description: "Live status updates, context usage tracking, and elapsed time for every agent.",
  },
  {
    icon: Terminal,
    title: "One-Click Deploy",
    description: "Start agents instantly with pre-configured models, permissions, and prompts.",
  },
] as const;

const TERMINAL_LINES = [
  { type: "prompt", text: "$ pulse start --agent backend-dev" },
  { type: "system", text: "[pulse] Starting agent backend-dev..." },
  { type: "system", text: "[pulse] Model: claude-sonnet-4 | Mode: bypass" },
  { type: "success", text: "[pulse] Agent connected. Terminal attached." },
  { type: "output", text: "" },
  { type: "agent", text: "I'll start by reviewing the project structure..." },
  { type: "agent", text: "Reading src/routes/api.ts and src/services/" },
  { type: "output", text: "" },
  { type: "prompt", text: "$ pulse status" },
  { type: "table", text: "  backend-dev   running   sonnet   2m 34s" },
  { type: "table", text: "  frontend-ui   waiting   haiku    5m 12s" },
  { type: "table", text: "  test-runner   idle      sonnet   --" },
] as const;

export function Landing() {
  return (
    <div className="min-h-screen bg-neutral-bg1 text-neutral-fg1 overflow-hidden">
      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-brand" />
          <span className="text-lg font-bold tracking-tight">Pulse</span>
        </div>
        <Link
          to="/login"
          className="btn-ghost px-4 py-2 text-sm flex items-center gap-1.5"
        >
          Sign in
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-16 pb-24 max-w-6xl mx-auto text-center">
        {/* Ambient glow */}
        <div className="glow-orb glow-orb-brand w-[500px] h-[500px] -top-48 left-1/2 -translate-x-1/2 opacity-40" />
        <div className="glow-orb glow-orb-purple w-[300px] h-[300px] top-20 -right-20 opacity-30" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-stroke bg-neutral-bg2 px-4 py-1.5 text-xs font-medium text-neutral-fg2 mb-8 animate-fade-up">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Remote Agent Manager
          </div>

          <h1 className="text-display max-w-3xl mx-auto mb-6 animate-fade-up stagger-1" style={{ fontFamily: '"Sora", var(--font-sans)' }}>
            Manage Claude agents{" "}
            <span className="text-gradient-brand">from anywhere</span>
          </h1>

          <p className="text-subtitle max-w-xl mx-auto mb-10 animate-fade-up stagger-2">
            Deploy, monitor, and control multiple Claude Code agents on your remote server
            through a beautiful web interface.
          </p>

          <div className="flex items-center justify-center gap-4 animate-fade-up stagger-3">
            <Link
              to="/login"
              className="btn-primary px-8 py-3 text-sm flex items-center gap-2"
            >
              Get Started
              <ChevronRight className="h-4 w-4" />
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-8 py-3 text-sm"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Terminal Demo */}
      <section className="px-6 pb-24 max-w-4xl mx-auto">
        <div className="glass rounded-2xl overflow-hidden shadow-16 animate-fade-up stagger-4">
          {/* Terminal title bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-stroke">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-danger/60" />
              <span className="h-3 w-3 rounded-full bg-warning/60" />
              <span className="h-3 w-3 rounded-full bg-success/60" />
            </div>
            <span className="text-[11px] font-mono text-neutral-fg3 ml-2">
              pulse &mdash; terminal
            </span>
          </div>

          {/* Terminal content */}
          <div className="p-5 font-mono text-[13px] leading-relaxed bg-neutral-bg1">
            {TERMINAL_LINES.map((line, i) => (
              <div key={i} className="whitespace-pre">
                {line.type === "prompt" && (
                  <span className="text-success">{line.text}</span>
                )}
                {line.type === "system" && (
                  <span className="text-neutral-fg3">{line.text}</span>
                )}
                {line.type === "success" && (
                  <span className="text-brand">{line.text}</span>
                )}
                {line.type === "agent" && (
                  <span className="text-purple">{line.text}</span>
                )}
                {line.type === "table" && (
                  <span className="text-neutral-fg2">{line.text}</span>
                )}
                {line.type === "output" && "\u00A0"}
              </div>
            ))}
            <span className="inline-block w-2 h-4 bg-brand animate-pulse ml-0.5" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-heading text-neutral-fg1 mb-3">
            Everything you need
          </h2>
          <p className="text-subtitle max-w-md mx-auto">
            A complete toolkit for managing AI coding agents on remote servers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className={`card-interactive p-6 animate-fade-up stagger-${i + 1}`}
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 rounded-lg bg-brand-light p-2.5">
                  <feature.icon className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <h3 className="text-title text-neutral-fg1 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-compact text-neutral-fg2">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 max-w-4xl mx-auto text-center">
        <div className="card p-10 relative overflow-hidden">
          <div className="glow-orb glow-orb-brand w-[300px] h-[300px] -bottom-32 left-1/2 -translate-x-1/2 opacity-30" />

          <div className="relative z-10">
            <h2 className="text-heading mb-3">
              Ready to get started?
            </h2>
            <p className="text-subtitle mb-8 max-w-md mx-auto">
              Install Pulse on your server and start managing agents in minutes.
            </p>

            <div className="inline-flex items-center gap-3 rounded-xl border border-stroke bg-neutral-bg1 px-5 py-3 mb-8">
              <code className="text-sm font-mono text-neutral-fg2">
                npx pulse-agent-manager
              </code>
            </div>

            <div className="flex justify-center">
              <Link
                to="/login"
                className="btn-primary px-8 py-3 text-sm flex items-center gap-2"
              >
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stroke px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-brand" />
            <span className="text-sm font-semibold text-neutral-fg2">Pulse</span>
          </div>
          <p className="text-xs text-neutral-fg3">
            Remote Agent Manager
          </p>
        </div>
      </footer>
    </div>
  );
}
