import { Link } from "react-router-dom";
import { Cpu, Zap, ArrowRight, Copy, Check, Monitor, Users, Activity } from "lucide-react";
import { useState } from "react";

export function Landing() {
  return (
    <div className="min-h-screen bg-app-bg">
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
    <header className="sticky top-0 z-50 bg-neutral-bg2/90 backdrop-blur-md border-b border-stroke">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-brand flex items-center justify-center">
            <Cpu className="h-4 w-4 text-white" />
          </div>
          <span className="text-[16px] font-bold text-neutral-fg1 tracking-tight">Pulse</span>
        </div>
        <nav className="hidden md:flex items-center gap-1 ml-2">
          <a href="#features" className="text-[13px] text-neutral-fg2 hover:text-neutral-fg1 px-3 py-1.5 rounded-lg hover:bg-neutral-bg3 transition-all duration-150">Features</a>
          <a href="#how-it-works" className="text-[13px] text-neutral-fg2 hover:text-neutral-fg1 px-3 py-1.5 rounded-lg hover:bg-neutral-bg3 transition-all duration-150">How it works</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <a
            href="https://github.com/bigbig6/pulse"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 text-[13px] text-neutral-fg2 hover:text-neutral-fg1 px-3 py-1.5 rounded-lg hover:bg-neutral-bg3 border border-stroke transition-all duration-150"
          >
            GitHub
          </a>
          <Link to="/dashboard" className="btn-primary px-4 py-1.5 text-[13px]">
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
      {/* Badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-stroke bg-neutral-bg2 px-4 py-1.5 mb-8 shadow-xs">
        <span className="h-1.5 w-1.5 rounded-full bg-brand" />
        <span className="text-[12px] font-medium text-neutral-fg2">Multi-agent Claude Code orchestrator</span>
      </div>

      {/* Headline */}
      <h1 className="text-[52px] font-bold text-neutral-fg1 tracking-tight leading-[1.1] mb-5">
        Orchestrate Claude agents<br />
        <span className="text-brand">at scale</span>
      </h1>

      {/* Subtitle */}
      <p className="text-[18px] text-neutral-fg2 leading-relaxed max-w-2xl mx-auto mb-10">
        Run multiple Claude Code instances in parallel. Monitor, control, and manage AI agents through a clean dashboard.
      </p>

      {/* CTAs */}
      <div className="flex items-center justify-center gap-3 mb-16 flex-wrap">
        <Link to="/dashboard" className="btn-primary flex items-center gap-2 px-6 py-3 text-[15px]">
          Get Started
          <ArrowRight className="h-4 w-4" />
        </Link>
        <a
          href="https://github.com/bigbig6/pulse"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary flex items-center gap-2 px-6 py-3 text-[15px]"
        >
          View on GitHub
        </a>
      </div>

      {/* Terminal preview */}
      <div className="bg-neutral-fg1 rounded-2xl overflow-hidden shadow-16 text-left border border-neutral-fg3/20 max-w-3xl mx-auto">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 bg-[#1a1a1e] border-b border-white/10">
          <span className="h-3 w-3 rounded-full bg-danger/70" />
          <span className="h-3 w-3 rounded-full bg-warning/70" />
          <span className="h-3 w-3 rounded-full bg-success/70" />
          <span className="ml-3 text-[12px] text-white/40 font-mono">pulse — dashboard</span>
        </div>
        {/* Terminal content */}
        <div className="px-5 py-4 font-mono text-[13px] space-y-1.5 bg-[#0e0e11]">
          <div className="flex items-center gap-2">
            <span className="text-success">●</span>
            <span className="text-white/80 font-semibold">Frontend Dev</span>
            <span className="text-white/40 text-[11px] ml-auto">Running · 4m 12s</span>
          </div>
          <p className="text-white/50 pl-5 text-[12px]">✓ Created Button component</p>
          <p className="text-white/50 pl-5 text-[12px]">✓ Updated routing config</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-warning">●</span>
            <span className="text-white/80 font-semibold">Backend API</span>
            <span className="text-white/40 text-[11px] ml-auto">Waiting · 1m 33s</span>
          </div>
          <p className="text-white/50 pl-5 text-[12px]">? Should I use PostgreSQL or SQLite?</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-neutral-fg3">●</span>
            <span className="text-white/60 font-semibold">Test Runner</span>
            <span className="text-white/40 text-[11px] ml-auto">Idle</span>
          </div>
          <p className="text-brand/80 pl-5 text-[12px] animate-pulse">█ _</p>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: Users,
    title: "Multi-Agent Management",
    description: "Run multiple Claude Code instances simultaneously. Each agent gets its own terminal session and context.",
  },
  {
    icon: Monitor,
    title: "Split View",
    description: "Monitor two agents side by side. Compare outputs, coordinate work, and stay in full control.",
  },
  {
    icon: Activity,
    title: "Real-time Monitoring",
    description: "Live terminal output, context window usage, and status tracking. Never miss what your agents are doing.",
  },
  {
    icon: Zap,
    title: "Instant Deploy",
    description: "Get started in minutes. Install the CLI, configure your project path, and your agents are running.",
  },
];

function Features() {
  return (
    <section id="features" className="max-w-5xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-[32px] font-bold text-neutral-fg1 tracking-tight mb-3">Everything you need</h2>
        <p className="text-[16px] text-neutral-fg2">Purpose-built for AI-powered development workflows</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="bg-neutral-bg2 border border-stroke rounded-2xl p-6 shadow-2 hover:shadow-4 hover:border-[rgba(0,0,0,0.12)] transition-all duration-200">
            <div className="h-10 w-10 rounded-xl bg-brand-light flex items-center justify-center mb-4">
              <f.icon className="h-5 w-5 text-brand" />
            </div>
            <h3 className="text-[15px] font-semibold text-neutral-fg1 mb-2">{f.title}</h3>
            <p className="text-[13px] text-neutral-fg2 leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  { n: "01", title: "Install", description: "Run npm install -g @pulse/cli to install the CLI globally." },
  { n: "02", title: "Configure", description: "Set up your Claude authentication (OAuth or API key) via the setup wizard." },
  { n: "03", title: "Create Agents", description: "Point each agent at a project directory. Configure model and permissions." },
  { n: "04", title: "Monitor", description: "Watch agents work in real-time. Send input, split views, stop or restart anytime." },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-16 border-t border-stroke">
      <div className="text-center mb-12">
        <h2 className="text-[32px] font-bold text-neutral-fg1 tracking-tight mb-3">How it works</h2>
        <p className="text-[16px] text-neutral-fg2">Up and running in four steps</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {STEPS.map((step) => (
          <div key={step.n} className="flex flex-col gap-3">
            <span className="text-[28px] font-bold text-brand/40 leading-none">{step.n}</span>
            <h3 className="text-[15px] font-semibold text-neutral-fg1">{step.title}</h3>
            <p className="text-[13px] text-neutral-fg2 leading-relaxed">{step.description}</p>
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
      <div className="bg-neutral-fg1 rounded-2xl p-10 md:p-14 text-center">
        <h2 className="text-[28px] md:text-[36px] font-bold text-white tracking-tight mb-3">
          Ready to start?
        </h2>
        <p className="text-[15px] text-white/60 mb-8 max-w-md mx-auto">
          Install Pulse and start orchestrating your Claude agents in minutes.
        </p>
        <button
          onClick={copy}
          className="inline-flex items-center gap-3 bg-white/10 hover:bg-white/15 rounded-xl px-5 py-3 font-mono text-[14px] text-white mb-6 transition-all duration-150 border border-white/10"
        >
          <span className="text-white/40">$</span>
          <span>npm install -g @pulse/cli</span>
          {copied ? (
            <Check className="h-4 w-4 text-success ml-2" />
          ) : (
            <Copy className="h-4 w-4 text-white/40 ml-2" />
          )}
        </button>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-semibold px-6 py-2.5 rounded-xl text-[14px] transition-colors duration-150"
          >
            Open Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-stroke">
      <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-brand flex items-center justify-center">
            <Cpu className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[14px] font-semibold text-neutral-fg1">Pulse</span>
        </div>
        <p className="text-[12px] text-neutral-fg3">Built with Claude Code</p>
        <a
          href="https://github.com/bigbig6/pulse"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] text-neutral-fg3 hover:text-neutral-fg1 transition-colors"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
