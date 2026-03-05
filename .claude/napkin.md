# Napkin

## Corrections
| Date | Source | What Went Wrong | What To Do Instead |
|------|--------|----------------|-------------------|
| 2026-03-03 | user | Terminal layout corruption persists when switching agents despite prior fix (b9a1dce) | Root cause: `agent:subscribe` fired before `fitAddon.fit()`, so tmux history was captured at old pane dimensions and written to default 80x24 terminal. Fix: defer subscribe into double-rAF after fit, send cols/rows with subscribe, resize tmux pane server-side before capture |

## User Preferences
- Commits follow conventional commits style: `feat(scope):`, `fix(scope):`
- Push directly to master
- Prefers Portuguese communication

## Patterns That Work
- Tailwind v4 + @layer components: NEVER use `@apply` with other component classes (e.g., `@apply badge-orange` fails). Always inline CSS properties directly.
- Tailwind v4 CSS var tokens: Define vars in `:root`, then map to `@theme` with `--color-*` prefix for Tailwind utility generation.
- Design system migration: Keep legacy class aliases (`.badge-primary`, `.input-fluent`) as direct CSS with same properties to avoid breaking existing components.
- xterm.js: always fit terminal BEFORE subscribing to data. Double-rAF ensures container has final dimensions.
- tmux: resize pane before capture-pane to get content at correct col width. Add 50ms delay for reflow.

## Patterns That Don't Work
- Previous fix (b9a1dce) for terminal layout corruption didn't fully resolve the issue — xterm columns/rows mismatch persists on agent switch

## Domain Notes
- Pulse: multi-agent Claude Code orchestrator with xterm.js terminals
- Monorepo: packages/web (Vite+React), packages/server (Node)
- xterm.js renders Claude CLI output via socket events
- Layout corruption = terminal cols/rows don't match container after switching agents
