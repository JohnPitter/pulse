import { Link } from "react-router-dom";
import { ArrowRight, Copy, Check, Monitor, Users, Activity, Zap } from "lucide-react";
import { useState } from "react";

export function Landing() {
  return (
    <div className="min-h-screen bg-bg">
      <Topbar />
      <Hero />
      <Features />
      <HowItWorks />
      <CtaBanner />
      <Footer />
    </div>
  );
}

function Topbar() {
  return (
    <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-border">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-orange flex items-center justify-center">
            <span className="text-[12px] font-bold text-white">P</span>
          </div>
          <span className="text-[15px] font-bold text-text-primary tracking-tight">Pulse</span>
        </div>

        <nav className="hidden md:flex items-center gap-0.5 ml-2">
          <a href="#features" className="text-[13px] text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg hover:bg-surface-muted transition-all">Features</a>
          <a href="#how-it-works" className="text-[13px] text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg hover:bg-surface-muted transition-all">How it works</a>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <a
            href="https://github.com/bigbig6/pulse"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg border border-border hover:bg-surface-muted transition-all"
          >
            GitHub
          </a>
          <Link to="/dashboard" className="btn btn-primary px-4 py-1.5 text-[13px]">
            Open App
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
      {/* Tag */}
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 mb-10">
        <span className="h-1.5 w-1.5 rounded-full bg-orange" />
        <span className="text-[12px] font-medium text-text-secondary">Multi-agent Claude Code orchestrator</span>
      </div>

      {/* Headline */}
      <h1 className="text-[52px] font-bold text-text-primary tracking-tight leading-[1.08] mb-5">
        Orchestrate Claude agents<br />
        <span className="text-orange">at scale</span>
      </h1>

      <p className="text-[17px] text-text-secondary leading-relaxed max-w-xl mx-auto mb-10">
        Run multiple Claude Code instances in parallel. Monitor, control, and manage AI agents through a clean dashboard.
      </p>

      {/* CTAs */}
      <div className="flex items-center justify-center gap-3 mb-16 flex-wrap">
        <Link to="/dashboard" className="btn btn-primary flex items-center gap-2 px-6 py-3 text-[14px] font-semibold">
          Get Started <ArrowRight className="h-4 w-4" />
        </Link>
        <a
          href="https://github.com/bigbig6/pulse"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary flex items-center gap-2 px-6 py-3 text-[14px]"
        >
          View on GitHub
        </a>
      </div>

      {/* Dashboard preview */}
      <div className="panel overflow-hidden shadow-[var(--shadow-modal)] max-w-3xl mx-auto text-left">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 bg-[#111827] border-b border-white/10">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
          <span className="ml-3 text-[11px] text-white/30 font-mono tracking-wider">pulse — dashboard</span>
        </div>

        {/* Agent rows */}
        <div className="bg-[#0D1117] px-5 py-4 font-mono text-[12px] space-y-3">
          {[
            { name: "Frontend Dev", status: "Running", statusColor: "bg-success", elapsed: "4m 12s", lines: ["✓ Created Button component", "✓ Updated routing config"] },
            { name: "Backend API", status: "Waiting", statusColor: "bg-warning", elapsed: "1m 33s", lines: ["? Should I use PostgreSQL or SQLite?"] },
            { name: "Test Runner", status: "Idle", statusColor: "bg-border-strong", elapsed: "", lines: [] },
          ].map((agent) => (
            <div key={agent.name}>
              <div className="flex items-center gap-2.5">
                <span className={`h-2 w-2 rounded-full ${agent.statusColor}`} />
                <span className="text-white/90 font-semibold">{agent.name}</span>
                <span className="badge badge-neutral ml-1">{agent.status}</span>
                {agent.elapsed && (
                  <span className="text-white/30 text-[10px] ml-auto">{agent.elapsed}</span>
                )}
              </div>
              {agent.lines.map((line, i) => (
                <p key={i} className="text-white/40 pl-5 mt-0.5 text-[11px]">{line}</p>
              ))}
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-orange/70 animate-[blink_1s_step-end_infinite]">█</span>
            <span className="text-white/20 text-[11px]">_</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: Users,
    title: "Multi-Agent Management",
    description: "Run multiple Claude Code instances simultaneously. Each agent gets its own session and context.",
    color: "text-orange",
  },
  {
    icon: Monitor,
    title: "Split View",
    description: "Monitor two agents side by side. Compare outputs and coordinate work in real time.",
    color: "text-blue",
  },
  {
    icon: Activity,
    title: "Real-time Monitoring",
    description: "Live output, context window usage, and status tracking. Never miss what your agents are doing.",
    color: "text-success",
  },
  {
    icon: Zap,
    title: "Instant Deploy",
    description: "Get started in minutes. Install the CLI, configure a project path, and agents are running.",
    color: "text-orange",
  },
];

function Features() {
  return (
    <section id="features" className="max-w-5xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-[30px] font-bold text-text-primary tracking-tight mb-2">Everything you need</h2>
        <p className="text-[15px] text-text-secondary">Purpose-built for AI-powered development workflows</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="panel p-6 hover:shadow-[var(--shadow-panel)] transition-all">
            <div className="h-9 w-9 rounded-lg border border-border bg-surface-muted flex items-center justify-center mb-4">
              <f.icon className={`h-4.5 w-4.5 ${f.color}`} />
            </div>
            <h3 className="text-[14px] font-semibold text-text-primary mb-2">{f.title}</h3>
            <p className="text-[13px] text-text-secondary leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  { n: "01", title: "Install", description: "Run npm install -g @pulse/cli to install the CLI globally." },
  { n: "02", title: "Configure", description: "Set up Claude auth (OAuth or API key) via the setup wizard." },
  { n: "03", title: "Create Agents", description: "Point agents at project directories. Configure model and permissions." },
  { n: "04", title: "Monitor", description: "Watch agents work in real time. Send input, stop, or restart anytime." },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-16 border-t border-border">
      <div className="text-center mb-12">
        <h2 className="text-[30px] font-bold text-text-primary tracking-tight mb-2">How it works</h2>
        <p className="text-[15px] text-text-secondary">Up and running in four steps</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {STEPS.map((step) => (
          <div key={step.n} className="flex flex-col gap-3">
            <span className="text-[32px] font-bold text-orange/30 leading-none font-mono">{step.n}</span>
            <h3 className="text-[14px] font-semibold text-text-primary">{step.title}</h3>
            <p className="text-[13px] text-text-secondary leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CtaBanner() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText("npm install -g @pulse/cli");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="max-w-5xl mx-auto px-6 py-16">
      <div className="bg-[#111827] rounded-2xl p-10 md:p-14 text-center">
        <h2 className="text-[28px] md:text-[34px] font-bold text-white tracking-tight mb-3">
          Ready to start?
        </h2>
        <p className="text-[14px] text-white/50 mb-8 max-w-sm mx-auto">
          Install Pulse and orchestrate your Claude agents in minutes.
        </p>

        <button
          onClick={copy}
          className="inline-flex items-center gap-3 bg-white/8 hover:bg-white/12 rounded-xl px-5 py-3 font-mono text-[13px] text-white mb-8 transition-all border border-white/10"
        >
          <span className="text-white/30">$</span>
          <span>npm install -g @pulse/cli</span>
          {copied ? (
            <Check className="h-3.5 w-3.5 text-success ml-2" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-white/30 ml-2" />
          )}
        </button>

        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-orange hover:bg-orange-hover text-white font-semibold px-6 py-2.5 rounded-xl text-[14px] transition-colors"
          >
            Open Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-orange flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">P</span>
          </div>
          <span className="text-[13px] font-semibold text-text-primary">Pulse</span>
        </div>
        <p className="text-[12px] text-text-disabled">Built with Claude Code</p>
        <a
          href="https://github.com/bigbig6/pulse"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] text-text-disabled hover:text-text-secondary transition-colors"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
