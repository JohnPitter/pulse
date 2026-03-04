# Full Application Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the entire Pulse frontend — Landing page, Login/Setup, Dashboard, Settings — following the industrial SaaS aesthetic defined in `design-dashboard.json` (clinical precision, light neutrals, amber/blue accents, dense but airy data layout).

**Architecture:** Replace the dark glass-morphism theme with the industrial light theme from design.json. The CSS variable system already supports light theme via `[data-theme="light"]` — we activate it globally, update variables to match design.json's palette exactly, then redesign each page and component top-down. No new dependencies needed.

**Tech Stack:** React 19, TailwindCSS 4, Lucide React, Zustand, xterm.js, framer-motion (minimal use)

---

## Design System Reference (from design-dashboard.json)

### Color Palette
```
pageBackground:    #E8E8EA   → --rt-app-bg (light)
surfaceBase:       #F2F2F4   → --rt-neutral-bg1
cardBackground:    #FFFFFF   → --rt-neutral-bg2
cardBackgroundAlt: #F7F7F9   → --rt-neutral-bg3
sidebarBackground: #FFFFFF
borderSubtle:      rgba(0,0,0,0.07)  → --rt-stroke
borderMedium:      rgba(0,0,0,0.12) → --rt-stroke2
textPrimary:       #111111   → --rt-neutral-fg1
textSecondary:     #6B7280   → --rt-neutral-fg2
textTertiary:      #9CA3AF   → --rt-neutral-fg3
amberAccent:       #F59E0B   → brand accent (warning color repurposed as primary accent)
blueAccent:        #6366F1   → info/nominal blue
successGreen:      #10B981
```

### Typography
- pageTitle: 28–32px, weight 600–700
- cardTitle: 18–22px, weight 600
- statValue: 28–40px, weight 700
- statLabel: 11–13px, weight 400–500, textSecondary
- body: 13–14px, weight 400, textSecondary
- label: 11–12px, weight 500, textTertiary

### Card System
- background: white
- border: 1px solid rgba(0,0,0,0.07)
- radius: 14–16px
- shadow: `0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)`

### Layout
- Sidebar: narrow icon rail + list, white bg, right border
- Page background: #E8E8EA
- Cards float on surface
- Information density is a feature

---

## Task 1: Update CSS Variables for Industrial Light Theme

**Files:**
- Modify: `packages/web/src/index.css`

**Goal:** Update the `[data-theme="light"]` block to match design.json palette exactly, and make light theme the DEFAULT by switching the root variables.

**Step 1: Replace `:root` and `[data-theme="light"]` blocks**

The strategy: make dark the opt-in (`[data-theme="dark"]`), make light the default (`:root`).

Replace the entire `:root` block with the light theme values from design.json:

```css
:root {
  /* Background layers — industrial light palette */
  --rt-neutral-bg1: #F2F2F4;        /* surfaceBase */
  --rt-neutral-bg2: #FFFFFF;        /* cardBackground */
  --rt-neutral-bg3: #F7F7F9;        /* cardBackgroundAlt */
  --rt-neutral-bg-hover: #EEEEF0;
  --rt-neutral-bg-subtle: #F2F2F4;
  --rt-neutral-bg-raised: #FFFFFF;

  /* Foregrounds */
  --rt-neutral-fg1: #111111;        /* textPrimary */
  --rt-neutral-fg2: #6B7280;        /* textSecondary */
  --rt-neutral-fg3: #9CA3AF;        /* textTertiary */
  --rt-neutral-fg-disabled: #D1D5DB;

  /* Brand — Amber accent (active/hot states) */
  --rt-brand: #F59E0B;
  --rt-brand-hover: #FBBF24;
  --rt-brand-pressed: #D97706;
  --rt-brand-light: rgba(245,158,11,0.10);
  --rt-brand-dark: #D97706;
  --rt-brand-glow: rgba(245,158,11,0.15);

  /* Strokes */
  --rt-stroke: rgba(0,0,0,0.07);
  --rt-stroke2: rgba(0,0,0,0.12);
  --rt-stroke-active: rgba(245,158,11,0.30);

  /* Status — Success */
  --rt-success: #10B981;
  --rt-success-light: rgba(16,185,129,0.10);
  --rt-success-dark: #059669;

  /* Status — Warning */
  --rt-warning: #F59E0B;
  --rt-warning-light: rgba(245,158,11,0.10);
  --rt-warning-dark: #D97706;

  /* Status — Danger */
  --rt-danger: #EF4444;
  --rt-danger-light: rgba(239,68,68,0.10);
  --rt-danger-dark: #DC2626;

  /* Status — Info / Blue accent */
  --rt-info: #6366F1;
  --rt-info-light: rgba(99,102,241,0.10);
  --rt-info-dark: #4F46E5;

  /* Purple accent */
  --rt-purple: #8B5CF6;
  --rt-purple-light: rgba(139,92,246,0.10);
  --rt-purple-dark: #7C3AED;

  /* App-level */
  --rt-app-bg: #E8E8EA;

  /* Glass morphism — light */
  --glass-bg: rgba(255,255,255,0.80);
  --glass-border: rgba(0,0,0,0.06);
  --glass-strong-bg: rgba(255,255,255,0.95);
  --glass-strong-border: rgba(0,0,0,0.08);

  /* Skeleton */
  --skeleton-from: #E5E7EB;
  --skeleton-mid: #F3F4F6;

  /* Scrollbar */
  --scrollbar-thumb: rgba(0,0,0,0.10);
  --scrollbar-thumb-hover: rgba(0,0,0,0.18);

  /* Card hover border */
  --card-hover-border: rgba(0,0,0,0.12);
  --card-interactive-hover-border: rgba(245,158,11,0.25);

  /* Badge neutral */
  --badge-neutral-bg: rgba(0,0,0,0.05);

  /* Dot pattern */
  --dot-pattern-color: rgba(0,0,0,0.05);

  /* Input hover border */
  --input-hover-border: rgba(0,0,0,0.14);

  /* Shadows — crisp and light */
  --rt-shadow-xs: 0 1px 2px rgba(0,0,0,0.04);
  --rt-shadow-2: 0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
  --rt-shadow-4: 0 2px 8px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
  --rt-shadow-8: 0 4px 16px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.04);
  --rt-shadow-16: 0 8px 32px rgba(0,0,0,0.10), 0 16px 48px rgba(0,0,0,0.05);
  --rt-shadow-brand: 0 4px 14px rgba(245,158,11,0.20), 0 2px 4px rgba(245,158,11,0.08);
  --rt-shadow-glow: 0 0 20px rgba(245,158,11,0.10), 0 0 60px rgba(245,158,11,0.04);
}
```

Replace the `[data-theme="light"]` block with the dark theme values (rename it to `[data-theme="dark"]`), keeping all the original dark values from the current `:root` block:

```css
[data-theme="dark"] {
  --rt-neutral-bg1: #08080A;
  --rt-neutral-bg2: #0E0E11;
  --rt-neutral-bg3: #161619;
  --rt-neutral-bg-hover: #1E1E22;
  --rt-neutral-bg-subtle: #0B0B0D;
  --rt-neutral-bg-raised: #1A1A1E;
  --rt-neutral-fg1: #EDEDEF;
  --rt-neutral-fg2: #8B8B93;
  --rt-neutral-fg3: #5C5C66;
  --rt-neutral-fg-disabled: #3E3E47;
  --rt-brand: #F97316;
  --rt-brand-hover: #FB923C;
  --rt-brand-pressed: #EA580C;
  --rt-brand-light: rgba(249,115,22,0.10);
  --rt-brand-dark: #C2410C;
  --rt-brand-glow: rgba(249,115,22,0.20);
  --rt-stroke: rgba(255,255,255,0.07);
  --rt-stroke2: rgba(255,255,255,0.04);
  --rt-stroke-active: rgba(249,115,22,0.25);
  --rt-success: #10B981;
  --rt-success-light: rgba(16,185,129,0.12);
  --rt-success-dark: #059669;
  --rt-warning: #F59E0B;
  --rt-warning-light: rgba(245,158,11,0.12);
  --rt-warning-dark: #D97706;
  --rt-danger: #EF4444;
  --rt-danger-light: rgba(239,68,68,0.12);
  --rt-danger-dark: #DC2626;
  --rt-info: #3B82F6;
  --rt-info-light: rgba(59,130,246,0.12);
  --rt-info-dark: #2563EB;
  --rt-purple: #8B5CF6;
  --rt-purple-light: rgba(139,92,246,0.12);
  --rt-purple-dark: #7C3AED;
  --rt-app-bg: #050507;
  --glass-bg: rgba(14,14,17,0.80);
  --glass-border: rgba(255,255,255,0.06);
  --glass-strong-bg: rgba(14,14,17,0.90);
  --glass-strong-border: rgba(255,255,255,0.08);
  --skeleton-from: #111113;
  --skeleton-mid: #1C1C1F;
  --scrollbar-thumb: rgba(255,255,255,0.06);
  --scrollbar-thumb-hover: rgba(255,255,255,0.12);
  --card-hover-border: rgba(255,255,255,0.10);
  --card-interactive-hover-border: rgba(249,115,22,0.15);
  --badge-neutral-bg: rgba(255,255,255,0.06);
  --dot-pattern-color: rgba(255,255,255,0.04);
  --input-hover-border: rgba(255,255,255,0.10);
  --rt-shadow-xs: 0 1px 2px rgba(0,0,0,0.3);
  --rt-shadow-2: 0 2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
  --rt-shadow-4: 0 4px 8px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2);
  --rt-shadow-8: 0 8px 16px rgba(0,0,0,0.4), 0 4px 6px rgba(0,0,0,0.2);
  --rt-shadow-16: 0 16px 32px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.25);
  --rt-shadow-brand: 0 4px 14px rgba(249,115,22,0.25), 0 2px 4px rgba(249,115,22,0.1);
  --rt-shadow-glow: 0 0 20px rgba(249,115,22,0.15), 0 0 60px rgba(249,115,22,0.05);
}
```

Also update `.card` component class to match design.json card style:
```css
.card {
  background: var(--color-neutral-bg2);
  border: 1px solid var(--color-stroke);
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
  transition: all 0.2s ease;
}
```

Also update `.btn-primary` to use amber:
```css
.btn-primary {
  background: linear-gradient(135deg, var(--color-brand), var(--color-brand-dark));
  color: #FFFFFF;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-brand);
}
```

**Step 2: Remove `[data-theme="light"]` overrides at bottom of file**

Delete the final block:
```css
[data-theme="light"] .glow-orb-brand { ... }
[data-theme="light"] .glow-orb-purple { ... }
```

Replace with dark equivalents:
```css
[data-theme="dark"] .glow-orb-brand {
  background: rgba(249,115,22,0.15);
}
[data-theme="dark"] .glow-orb-purple {
  background: rgba(139,92,246,0.10);
}
```

**Step 3: Build check**

```bash
cd C:/Users/joaop/Desenvolvimento/Projects/pulse
pnpm build
```
Expected: no errors.

**Step 4: Commit**

```bash
git add packages/web/src/index.css
git commit -m "feat(design): switch to industrial light theme as default — amber/blue accent palette"
```

---

## Task 2: Redesign AgentSidebar

**Files:**
- Modify: `packages/web/src/components/sidebar/AgentSidebar.tsx`
- Modify: `packages/web/src/components/sidebar/AgentSidebarItem.tsx`

**Goal:** Sidebar becomes a clean white panel with icon-rail style header, amber status dots, refined list items matching design.json's `listItem` component spec.

### AgentSidebar.tsx

```tsx
// Header: white bg, brand logo left, action buttons right
// Status pills: cleaner, smaller, icon + count only
// Search: pill-shaped, subtle
// Groups: uppercase label, tight spacing
// Overall: border-r border-stroke, white bg, no shadow-16 (use shadow-2)
```

**New AgentSidebar structure:**
```tsx
<aside className={`
  fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-neutral-bg2 border-r border-stroke
  transform transition-transform duration-300 ease-in-out
  md:relative md:z-auto md:border md:rounded-2xl md:shadow-2 md:shrink-0 md:transform-none
  ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
`}>
  {/* Header */}
  <div className="flex items-center justify-between px-4 h-14 border-b border-stroke">
    <div className="flex items-center gap-2.5">
      <div className="h-6 w-6 rounded-lg bg-brand flex items-center justify-center">
        <Cpu className="h-3.5 w-3.5 text-white" />
      </div>
      <span className="text-[15px] font-bold text-neutral-fg1 tracking-tight">Pulse</span>
    </div>
    <div className="flex items-center gap-1">
      {/* split / new / settings / logout buttons — same logic, new styling */}
      {/* Use: rounded-lg h-7 w-7 hover:bg-neutral-bg3 text-neutral-fg3 hover:text-neutral-fg1 */}
    </div>
  </div>

  {/* Stats row — active count badges */}
  {agents.length > 0 && (
    <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-stroke">
      {FILTER_PILLS.map((pill) => {
        const count = countFor(pill.key);
        const isSelected = statusFilter.has(pill.key);
        return (
          <button
            key={pill.key}
            type="button"
            onClick={() => toggleFilter(pill.key)}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all duration-150 ${
              isSelected
                ? `bg-neutral-fg1 text-neutral-bg2`
                : `bg-neutral-bg3 text-neutral-fg3 hover:bg-neutral-bg-hover hover:text-neutral-fg2`
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : pill.dotBg}`} />
            {count}
          </button>
        );
      })}
      <span className="ml-auto text-[11px] font-medium text-neutral-fg3 tabular-nums">{counts.total} total</span>
    </div>
  )}

  {/* Search */}
  <div className="px-3 py-2.5">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-fg3" />
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search agents..."
        className="w-full rounded-full border border-stroke bg-neutral-bg3 py-1.5 pl-8.5 pr-4 text-[13px] text-neutral-fg1 placeholder:text-neutral-fg3 outline-none focus:border-brand focus:bg-neutral-bg2 transition-all duration-150"
      />
    </div>
  </div>

  {/* Agent list */}
  <div className="flex-1 overflow-y-auto px-2 pb-2">
    {/* groups map — same structure, updated AgentSidebarItem */}
    {groups.map((group) => (
      <div key={group.label} className="mb-4">
        <div className="flex items-center justify-between px-2 mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-fg3">
            {group.label}
          </span>
          <span className="text-[10px] font-semibold text-neutral-fg3 tabular-nums">
            {group.agents.length}
          </span>
        </div>
        <div className="space-y-1">
          {group.agents.map((agent) => (
            <AgentSidebarItem key={agent.id} agent={agent} selected={...} onSelect={onSelectAgent} />
          ))}
        </div>
      </div>
    ))}
  </div>
</aside>
```

### AgentSidebarItem.tsx

Match design.json `listItem` component:
- White card bg, 8px radius, subtle border
- Left: colored status dot (animated for running/waiting)
- Center: name (14px, medium, textPrimary) + subtitle line (12px, textSecondary)
- Right: play/stop button (visible on hover)
- NO left border-l colored stripe — replace with status dot only
- Selected: amber left border + slightly elevated shadow

```tsx
<div
  role="button"
  tabIndex={0}
  onClick={() => onSelect(agent.id)}
  onKeyDown={...}
  className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-150 ${
    selected
      ? "bg-amber-50 border border-amber-200/70 shadow-xs"
      : "hover:bg-neutral-bg3 border border-transparent hover:border-stroke"
  }`}
>
  {/* Status dot */}
  <span className="relative inline-flex shrink-0">
    {(agent.status === "running" || agent.status === "waiting") && (
      <span className={`absolute inline-flex h-2 w-2 rounded-full ${statusCfg.color} opacity-60 ${agent.status === "running" ? "animate-ping" : "animate-pulse"}`} />
    )}
    <span className={`relative inline-flex h-2 w-2 rounded-full ${statusCfg.color}`} />
  </span>

  {/* Content */}
  <div className="min-w-0 flex-1">
    <div className="flex items-center gap-1.5">
      <p className="truncate text-[13px] font-semibold text-neutral-fg1 leading-snug">
        {agent.name}
      </p>
      {agent.thinkingEnabled === 1 && (
        <Brain className="h-3 w-3 shrink-0 text-purple" />
      )}
    </div>
    <div className="flex items-center gap-1.5 mt-0.5">
      <span className={`text-[10px] font-medium ${statusCfg.textColor}`}>
        {statusCfg.label}
      </span>
      {elapsed && (
        <>
          <span className="text-neutral-fg3 text-[10px]">·</span>
          <span className="text-[10px] text-neutral-fg3 tabular-nums">{elapsed}</span>
        </>
      )}
      <span className={`ml-auto shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${modelBadgeColor}`}>
        {MODEL_LABELS[agent.model] ?? agent.model}
      </span>
    </div>
    {agent.lastMessage && (
      <p className="mt-0.5 truncate text-[11px] text-neutral-fg3 leading-relaxed">
        {agent.lastMessage}
      </p>
    )}
  </div>

  {/* Toggle button */}
  <button type="button" onClick={handleToggle} className={`shrink-0 opacity-0 group-hover:opacity-100 ${selected ? "opacity-100" : ""} rounded-lg p-1 transition-all duration-150 ${isRunning ? "text-danger hover:bg-danger-light" : "text-success hover:bg-success-light"}`}>
    {isRunning ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
  </button>
</div>
```

**Step 3: Build check**
```bash
pnpm build
```

**Step 4: Commit**
```bash
git add packages/web/src/components/sidebar/
git commit -m "feat(sidebar): redesign — industrial light theme, dot-based status, clean list items"
```

---

## Task 3: Redesign Dashboard Layout + Terminal Area

**Files:**
- Modify: `packages/web/src/pages/Dashboard.tsx`
- Modify: `packages/web/src/components/terminal/TerminalInfoBar.tsx`
- Modify: `packages/web/src/components/terminal/TerminalStatusBar.tsx`

**Goal:** Dashboard shell becomes a proper card-based layout. TerminalInfoBar becomes a clean topbar with stats. TerminalStatusBar becomes a refined footer pill row.

### Dashboard.tsx outer shell

```tsx
// Current: flex h-screen flex-col bg-app-bg md:flex-row md:p-3 md:gap-3
// New: same but ensure bg-app-bg is #E8E8EA (already set via CSS var)
// The outer rounded-2xl content area gets a white card treatment

<div className="flex h-screen flex-col bg-app-bg md:flex-row md:p-3 md:gap-3">
  {/* mobile header — same structure, lighter styling */}

  <AgentSidebar ... />

  {/* Main content card */}
  <div className="flex min-w-0 flex-1 flex-col bg-neutral-bg2 md:border md:border-stroke md:rounded-2xl md:shadow-2 overflow-hidden">
    {/* terminal area */}
  </div>
</div>
```

### TerminalInfoBar.tsx redesign

Current: dark status bar with lots of badges
New: clean white topbar matching design.json `topbar` component

```tsx
// Height: 52px
// Background: white (bg-neutral-bg2)
// Bottom border: 1px solid stroke
// Left: status dot + agent name (bold) + model badge + thinking icon
// Center-ish: context usage as a subtle inline stat
// Right: action icon buttons (toggle, edit, duplicate, stop)
```

New structure:
```tsx
<div className="flex items-center h-[52px] px-4 border-b border-stroke bg-neutral-bg2 shrink-0 gap-3">
  {/* Status dot */}
  <span className="relative inline-flex shrink-0">
    {isRunning && <span className={`absolute h-2 w-2 rounded-full ${statusColor} opacity-60 animate-ping`} />}
    <span className={`relative h-2 w-2 rounded-full ${statusColor}`} />
  </span>

  {/* Agent name */}
  <span className="text-[15px] font-semibold text-neutral-fg1 truncate tracking-tight">
    {agent.name}
  </span>

  {/* Model badge */}
  <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${modelColor}`}>
    {modelLabel}
  </span>

  {/* Thinking icon */}
  {agent.thinkingEnabled === 1 && <Brain className="h-3.5 w-3.5 text-purple shrink-0" />}

  {/* Context usage */}
  {contextUsage && (
    <div className="flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full bg-neutral-bg3 border border-stroke">
      <span className="text-[10px] font-medium text-neutral-fg3">ctx</span>
      <span className="text-[11px] font-semibold text-neutral-fg2 tabular-nums">{contextUsage}</span>
    </div>
  )}

  {/* Spacer */}
  <div className="flex-1" />

  {/* Action buttons */}
  <div className="flex items-center gap-0.5">
    {/* Toggle: play/stop */}
    <button className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-fg3 hover:bg-neutral-bg3 hover:text-neutral-fg1 transition-all duration-150">
      {isRunning ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
    </button>
    {/* Edit */}
    <button className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-fg3 hover:bg-neutral-bg3 hover:text-neutral-fg1 transition-all duration-150">
      <Pencil className="h-3.5 w-3.5" />
    </button>
    {/* Duplicate */}
    <button className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-fg3 hover:bg-neutral-bg3 hover:text-neutral-fg1 transition-all duration-150">
      <Copy className="h-3.5 w-3.5" />
    </button>
    {/* Stop (danger) */}
    {isRunning && (
      <button className="flex h-8 w-8 items-center justify-center rounded-lg text-danger hover:bg-danger-light transition-all duration-150">
        <StopCircle className="h-3.5 w-3.5" />
      </button>
    )}
  </div>
</div>
```

### TerminalStatusBar.tsx redesign

```tsx
// Slim footer: 32px height
// Background: bg-neutral-bg3/60 (slightly tinted)
// Top border: 1px solid stroke
// Left: green dot + "Connected" text
// Right: CLI version + elapsed time

<div className="flex items-center justify-between px-4 h-8 border-t border-stroke bg-neutral-bg3/60 shrink-0">
  <div className="flex items-center gap-1.5">
    <span className="h-1.5 w-1.5 rounded-full bg-success" />
    <span className="text-[11px] text-neutral-fg3">Connected</span>
  </div>
  <div className="flex items-center gap-3">
    {cliVersion && (
      <span className="text-[10px] text-neutral-fg3 tabular-nums">v{cliVersion}</span>
    )}
    <span className="text-[10px] text-neutral-fg3 tabular-nums">{elapsed}</span>
  </div>
</div>
```

**Step 3: Build check**
```bash
pnpm build
```

**Step 4: Commit**
```bash
git add packages/web/src/pages/Dashboard.tsx packages/web/src/components/terminal/
git commit -m "feat(dashboard): redesign terminal area — clean topbar, slim status footer"
```

---

## Task 4: Redesign Empty States + Agent Form Dialog

**Files:**
- Modify: `packages/web/src/pages/Dashboard.tsx` (NoAgentsState, SelectAgentState functions)
- Modify: `packages/web/src/components/agents/AgentFormDialog.tsx`

**Goal:** Empty states use the design.json card style. Agent form dialog becomes a clean modal with proper light-theme styling.

### NoAgentsState

```tsx
function NoAgentsState({ onCreateAgent }: { onCreateAgent: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="bg-neutral-bg2 border border-stroke rounded-2xl p-10 flex flex-col items-center gap-6 max-w-md w-full shadow-4">
        <div className="rounded-2xl bg-brand-light p-5">
          <Cpu className="h-10 w-10 text-brand" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-[22px] font-bold text-neutral-fg1 tracking-tight">No agents yet</h2>
          <p className="text-[14px] text-neutral-fg2 leading-relaxed max-w-xs">
            Create your first Claude agent to get started. Each agent runs in its own terminal session.
          </p>
        </div>
        <button
          onClick={onCreateAgent}
          className="btn-primary flex items-center gap-2 px-6 py-2.5 text-[14px]"
        >
          <Plus className="h-4 w-4" />
          Create Agent
        </button>
      </div>
    </div>
  );
}
```

### SelectAgentState

```tsx
function SelectAgentState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="bg-neutral-bg2 border border-stroke rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm w-full shadow-2">
        <div className="rounded-xl bg-neutral-bg3 p-4">
          <Terminal className="h-7 w-7 text-neutral-fg3" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-[15px] font-semibold text-neutral-fg1">Select an agent</p>
          <p className="text-[13px] text-neutral-fg2 leading-relaxed">
            Choose an agent from the sidebar to view its terminal output
          </p>
        </div>
      </div>
    </div>
  );
}
```

### AgentFormDialog.tsx

Read file first, then update:
- Dialog overlay: `bg-black/20 backdrop-blur-sm` (lighter overlay for light theme)
- Dialog panel: `bg-neutral-bg2 border border-stroke rounded-2xl shadow-16`
- Inputs: `input-fluent` class (already defined, will work with new theme)
- Buttons: `btn-primary` / `btn-secondary`
- Model selector cards: white bg, amber border/bg when selected
- Permission mode cards: same pattern

**Step 3: Build check**
```bash
pnpm build
```

**Step 4: Commit**
```bash
git add packages/web/src/pages/Dashboard.tsx packages/web/src/components/agents/AgentFormDialog.tsx
git commit -m "feat(ui): redesign empty states and agent form dialog for light theme"
```

---

## Task 5: Redesign Login + SetupPassword Pages

**Files:**
- Modify: `packages/web/src/pages/Login.tsx`

**Goal:** Clean, centered card on the industrial gray background. No glass morphism. Crisp white card, amber brand accent.

### Login page structure:

```tsx
// Page: bg-app-bg (#E8E8EA), flex center
// Card: white, rounded-2xl, border border-stroke, shadow-8, p-10, max-w-sm w-full
// Logo: amber square icon + "Pulse" bold text, centered, mb-8
// Input: input-fluent class
// Button: btn-primary, full width
// No framer-motion animations (or very subtle fade-in)

<div className="min-h-screen bg-app-bg flex items-center justify-center p-6">
  <div className="bg-neutral-bg2 border border-stroke rounded-2xl shadow-8 p-10 w-full max-w-sm">
    {/* Logo */}
    <div className="flex flex-col items-center gap-3 mb-8">
      <div className="h-12 w-12 rounded-xl bg-brand flex items-center justify-center">
        <Cpu className="h-6 w-6 text-white" />
      </div>
      <div className="text-center">
        <h1 className="text-[22px] font-bold text-neutral-fg1 tracking-tight">Pulse</h1>
        <p className="text-[13px] text-neutral-fg2 mt-0.5">Multi-agent Claude orchestrator</p>
      </div>
    </div>

    {/* Form */}
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-[12px] font-medium text-neutral-fg2 mb-1.5 block">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="input-fluent w-full"
          autoFocus
        />
      </div>
      {error && (
        <p className="text-[12px] text-danger">{error}</p>
      )}
      <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-[14px] mt-2">
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  </div>
</div>
```

**Same pattern for SetupPassword** — replace the current glass card with a white card.

**Step 2: Build check**
```bash
pnpm build
```

**Step 3: Commit**
```bash
git add packages/web/src/pages/Login.tsx
git commit -m "feat(login): redesign — industrial light card, amber brand, clean form"
```

---

## Task 6: Redesign Settings Page

**Files:**
- Modify: `packages/web/src/pages/Settings.tsx`

**Goal:** Settings page becomes a clean multi-section card layout on the gray background.

### Settings page structure:

```tsx
// Page: bg-app-bg, min-h-screen
// Layout: max-w-2xl mx-auto py-8 px-6
// Header: back button + "Settings" title
// Sections: each is a card (bg-neutral-bg2, border, rounded-2xl, shadow-2)
// Section header: border-b border-stroke px-6 py-4, title (16px bold) + subtitle (13px secondary)
// Section content: px-6 py-5

// Reuse existing GlassCard? No — replace with plain cards
// Structure for each section:

<div className="bg-neutral-bg2 border border-stroke rounded-2xl shadow-2 overflow-hidden">
  <div className="px-6 py-4 border-b border-stroke">
    <h3 className="text-[15px] font-semibold text-neutral-fg1">Change Password</h3>
    <p className="text-[13px] text-neutral-fg2 mt-0.5">Update your admin password</p>
  </div>
  <div className="px-6 py-5">
    {/* content */}
  </div>
</div>
```

**Full page layout:**
```tsx
<div className="min-h-screen bg-app-bg">
  <div className="max-w-2xl mx-auto py-8 px-6 space-y-4">
    {/* Back button + title */}
    <div className="flex items-center gap-3 mb-6">
      <Link to="/dashboard" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-bg3 text-neutral-fg3 hover:text-neutral-fg1 border border-stroke transition-all duration-150">
        <ArrowLeft className="h-4 w-4" />
      </Link>
      <h1 className="text-[24px] font-bold text-neutral-fg1 tracking-tight">Settings</h1>
    </div>

    {/* Sections */}
    <ChangePasswordSection />
    <ClaudeAuthSection />
    <PluginsSection />
    <SessionSection />
  </div>
</div>
```

**Step 2: Build check**
```bash
pnpm build
```

**Step 3: Commit**
```bash
git add packages/web/src/pages/Settings.tsx
git commit -m "feat(settings): redesign — card-based sections, industrial light layout"
```

---

## Task 7: Redesign SetupWizard Page

**Files:**
- Modify: `packages/web/src/pages/SetupWizard.tsx`

**Goal:** Setup wizard becomes a clean stepped card UI. No glass morphism. White card, amber accents on active step.

### SetupWizard structure:

```tsx
// Page: bg-app-bg, min-h-screen, flex center
// Card: max-w-lg, white, rounded-2xl, border, shadow-8

// Step indicator: 3 steps with connecting line
// Active: amber circle + label
// Done: checkmark circle
// Inactive: gray circle

<div className="min-h-screen bg-app-bg flex items-center justify-center p-6">
  <div className="bg-neutral-bg2 border border-stroke rounded-2xl shadow-8 w-full max-w-lg overflow-hidden">
    {/* Step indicator at top */}
    <div className="px-8 pt-8 pb-6 border-b border-stroke">
      <div className="flex items-center gap-0">
        {steps.map((step, i) => (
          <Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[13px] font-bold ${
                i < currentStep ? "bg-brand text-white" :
                i === currentStep ? "bg-brand text-white ring-4 ring-brand/20" :
                "bg-neutral-bg3 text-neutral-fg3 border border-stroke"
              }`}>
                {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-[11px] font-medium ${i <= currentStep ? "text-neutral-fg2" : "text-neutral-fg3"}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-3 mb-5 ${i < currentStep ? "bg-brand" : "bg-stroke"}`} />
            )}
          </Fragment>
        ))}
      </div>
    </div>

    {/* Step content */}
    <div className="px-8 py-6">
      {/* MethodSelection / OAuthSetup / ApiKeySetup */}
    </div>
  </div>
</div>
```

**Step 2: Build check**
```bash
pnpm build
```

**Step 3: Commit**
```bash
git add packages/web/src/pages/SetupWizard.tsx
git commit -m "feat(setup): redesign wizard — stepped card, amber progress indicator"
```

---

## Task 8: Redesign Landing Page

**Files:**
- Modify: `packages/web/src/pages/Landing.tsx`

**Goal:** Landing becomes a premium industrial SaaS marketing page. Light gray background (#E8E8EA), white cards for features, amber CTA buttons, clean typography hierarchy.

### Landing page layout:

```
- Topbar: white, sticky, logo left + nav + CTA right
- Hero section: centered, large heading, subtitle, two CTA buttons + terminal preview
- Features grid: 4 cards (white, border, rounded-2xl, shadow-2)
- How it works: numbered steps
- Install CTA: amber-tinted card with command
- Footer: minimal
```

### Topbar:
```tsx
<header className="sticky top-0 z-50 bg-neutral-bg2/90 backdrop-blur-md border-b border-stroke">
  <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-6">
    <div className="flex items-center gap-2.5">
      <div className="h-7 w-7 rounded-lg bg-brand flex items-center justify-center">
        <Cpu className="h-4 w-4 text-white" />
      </div>
      <span className="text-[16px] font-bold text-neutral-fg1 tracking-tight">Pulse</span>
    </div>
    <nav className="hidden md:flex items-center gap-1 ml-4">
      <a href="#features" className="text-[13px] text-neutral-fg2 hover:text-neutral-fg1 px-3 py-1.5 rounded-lg hover:bg-neutral-bg3 transition-all">Features</a>
      <a href="#how-it-works" className="text-[13px] text-neutral-fg2 hover:text-neutral-fg1 px-3 py-1.5 rounded-lg hover:bg-neutral-bg3 transition-all">How it works</a>
    </nav>
    <div className="ml-auto flex items-center gap-2">
      <a href="https://github.com/..." className="text-[13px] text-neutral-fg2 hover:text-neutral-fg1 px-3 py-1.5 rounded-lg hover:bg-neutral-bg3 border border-stroke transition-all">
        GitHub
      </a>
      <Link to="/dashboard" className="btn-primary px-4 py-1.5 text-[13px]">
        Open App
      </Link>
    </div>
  </div>
</header>
```

### Hero:
```tsx
<section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
  {/* Badge */}
  <div className="inline-flex items-center gap-2 rounded-full border border-stroke bg-neutral-bg2 px-4 py-1.5 mb-8">
    <span className="h-1.5 w-1.5 rounded-full bg-brand" />
    <span className="text-[12px] font-medium text-neutral-fg2">Multi-agent Claude orchestrator</span>
  </div>

  {/* Headline */}
  <h1 className="text-[52px] font-bold text-neutral-fg1 tracking-tight leading-[1.1] mb-6">
    Orchestrate Claude agents<br />
    <span className="text-brand">at scale</span>
  </h1>

  {/* Subtitle */}
  <p className="text-[18px] text-neutral-fg2 leading-relaxed max-w-2xl mx-auto mb-10">
    Run multiple Claude Code instances in parallel. Monitor, control, and manage AI agents through a clean dashboard.
  </p>

  {/* CTAs */}
  <div className="flex items-center justify-center gap-3 mb-16">
    <Link to="/dashboard" className="btn-primary px-6 py-3 text-[15px]">
      Get Started
    </Link>
    <a href="https://github.com/..." className="btn-secondary px-6 py-3 text-[15px]">
      View on GitHub
    </a>
  </div>

  {/* Terminal preview card */}
  <div className="bg-neutral-fg1 rounded-2xl overflow-hidden shadow-16 text-left border border-neutral-fg3/20">
    <div className="flex items-center gap-1.5 px-4 py-3 bg-neutral-fg1/80 border-b border-white/10">
      <span className="h-3 w-3 rounded-full bg-danger/70" />
      <span className="h-3 w-3 rounded-full bg-warning/70" />
      <span className="h-3 w-3 rounded-full bg-success/70" />
      <span className="ml-3 text-[12px] text-white/40 font-mono">pulse — terminal</span>
    </div>
    <div className="px-5 py-4 font-mono text-[13px] space-y-1">
      {/* Terminal demo lines */}
      <p><span className="text-brand">❯</span> <span className="text-green-400">Agent "Frontend Dev"</span> <span className="text-white/60">running</span></p>
      <p className="text-white/60 pl-4">✓ Created 3 components</p>
      <p className="text-white/60 pl-4">✓ Updated routing</p>
      <p><span className="text-brand">❯</span> <span className="text-blue-400">Agent "Backend API"</span> <span className="text-white/60">waiting for input</span></p>
      <p className="text-white/60 pl-4">? Should I use PostgreSQL or SQLite?</p>
      <p className="text-white/50">█</p>
    </div>
  </div>
</section>
```

### Feature cards:
```tsx
// id="features"
<section className="max-w-5xl mx-auto px-6 py-16">
  <h2 className="text-[32px] font-bold text-neutral-fg1 tracking-tight text-center mb-3">Everything you need</h2>
  <p className="text-[16px] text-neutral-fg2 text-center mb-12">Purpose-built for AI-powered development workflows</p>

  <div className="grid grid-cols-2 gap-4">
    {features.map((f) => (
      <div key={f.title} className="bg-neutral-bg2 border border-stroke rounded-2xl p-6 shadow-2 hover:shadow-4 hover:border-[rgba(0,0,0,0.12)] transition-all duration-200">
        <div className="h-10 w-10 rounded-xl bg-brand-light flex items-center justify-center mb-4">
          <f.Icon className="h-5 w-5 text-brand" />
        </div>
        <h3 className="text-[15px] font-semibold text-neutral-fg1 mb-2">{f.title}</h3>
        <p className="text-[13px] text-neutral-fg2 leading-relaxed">{f.description}</p>
      </div>
    ))}
  </div>
</section>
```

### Install CTA:
```tsx
<section className="max-w-5xl mx-auto px-6 py-16">
  <div className="bg-neutral-fg1 rounded-2xl p-10 text-center">
    <h2 className="text-[28px] font-bold text-white tracking-tight mb-3">Ready to start?</h2>
    <p className="text-[15px] text-white/60 mb-8">Install Pulse and start orchestrating your agents in minutes</p>
    <div className="inline-flex items-center gap-3 bg-white/10 rounded-xl px-5 py-3 font-mono text-[14px] text-white mb-6">
      <span className="text-white/40">$</span>
      <span>npm install -g @pulse/cli</span>
      <button className="ml-2 text-white/40 hover:text-white transition-colors">
        <Copy className="h-4 w-4" />
      </button>
    </div>
    <div className="flex items-center justify-center gap-3">
      <Link to="/dashboard" className="bg-brand hover:bg-brand-hover text-white font-semibold px-6 py-2.5 rounded-xl text-[14px] transition-colors">
        Open Dashboard
      </Link>
    </div>
  </div>
</section>
```

**Step 2: Build check**
```bash
pnpm build
```

**Step 3: Commit**
```bash
git add packages/web/src/pages/Landing.tsx
git commit -m "feat(landing): redesign — industrial SaaS aesthetic, amber hero, feature cards"
```

---

## Task 9: Final Polish — Common Components + Cleanup

**Files:**
- Modify: `packages/web/src/components/common/GlassCard.tsx` (adapt for light theme or deprecate)
- Modify: `packages/web/src/components/common/Badge.tsx` (verify colors still correct)
- Modify: `packages/web/src/components/agents/AgentCard.tsx` (if used anywhere)
- Modify: `packages/web/src/components/agents/AgentFormDialog.tsx` (read and update fully)
- Verify: `packages/web/src/App.tsx` — remove any leftover dark theme references

**Step 1: Update GlassCard**

Since we're on light theme, glass becomes just a white card with backdrop:
```tsx
// GlassCard.tsx — keep the API, update the classes
// glass class now renders as semi-transparent white card
// On light theme, glass = bg-white/80 backdrop-blur border border-stroke rounded-2xl
// The existing .glass CSS class already has the right structure (it reads from vars)
// No code change needed — CSS vars handle it
```

**Step 2: Verify Badge colors**

Run dev server and visually verify all badge variants look good on light background. The `.badge-*` classes use `var(--color-*)` which now map to light palette — should be fine.

**Step 3: Remove any `data-theme="light"` attributes from App.tsx**

Check if App.tsx sets `data-theme="light"` anywhere — remove if so (light is now default).

**Step 4: Full build + type check**
```bash
cd C:/Users/joaop/Desenvolvimento/Projects/pulse
pnpm build
```
Expected: zero errors, zero warnings.

**Step 5: Final commit**
```bash
git add -A
git commit -m "feat(design): complete industrial light theme redesign — all pages updated"
```

---

## Testing Checklist

After all tasks complete:

1. **Landing page** (`/`): Hero loads, feature cards visible, terminal demo renders, install CTA works
2. **Login page** (`/login`): White card on gray bg, amber brand, form submits
3. **Setup wizard** (`/setup`): Step indicator shows amber active state
4. **Dashboard** (`/dashboard`):
   - Sidebar: white bg, status dots, agent items correct
   - Terminal area: clean topbar with agent info, slim status footer
   - Empty states: white cards centered
   - Split mode: two terminals side by side with divider
5. **Settings** (`/settings`): Card sections layout, all forms functional
6. **Mobile**: Sidebar drawer opens/closes, mobile header visible
7. **No dark artifacts**: No dark backgrounds visible anywhere (glass morphism renders white/light)

## Notes

- `xterm.js` terminal renders with its own dark theme internally — this is intentional (terminal content is always dark-on-dark). The surrounding chrome is light.
- The `.glass` and `.glass-strong` classes now render as light frosted glass using the updated CSS vars — no code changes needed.
- `framer-motion` animations in Login.tsx can be kept or simplified — just ensure they don't reference old dark background colors.
- The `MODEL_BADGE_COLORS` in AgentSidebarItem use `bg-info/10 text-info`, `bg-brand-light text-brand`, `bg-purple-light text-purple` — these work fine on light theme.
