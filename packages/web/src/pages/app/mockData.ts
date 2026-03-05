import { getPersistedLanguage, toIntlLocale } from "../../i18n";

export type TaskStatus = "backlog" | "scheduled" | "running" | "completed" | "failed";
export type TaskPriority = "low" | "medium" | "high";
export type AgentState = "idle" | "running" | "offline";
export type ExecutionResult = "success" | "fail";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_at: string | null;
  scheduled_at: string | null;
  agent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  state: AgentState;
  current_task_id: string | null;
  last_seen_at: string;
}

export interface Execution {
  id: string;
  task_id: string;
  agent_id: string;
  result: ExecutionResult;
  summary: string;
  logs_count: number;
  started_at: string;
  ended_at: string;
}

export interface PlanningYear {
  year: number;
  months: Array<{
    month: number;
    planned_tasks: number;
    milestones: string[];
  }>;
}

export interface Project {
  id: string;
  name: string;
  summary: string;
  owner: string;
  status: "active" | "paused" | "planning";
  tasks: string[];
}

export interface SkillCatalogItem {
  id: string;
  name: string;
  category: "automation" | "analysis" | "connector";
  description: string;
}

export interface PluginItem {
  id: string;
  name: string;
  status: "installed" | "available";
  version: string;
}

export interface ChatThread {
  id: string;
  title: string;
  updated_at: string;
  agent_id: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    created_at: string;
  }>;
}

export interface FileRecord {
  id: string;
  name: string;
  kind: "image" | "document" | "audio" | "dataset";
  project_id: string;
  size: string;
  updated_at: string;
}

export const DASHBOARD_BACKLOG = {
  next_due: "Today 16:00",
  backlog_size: 24,
  ready_to_run: 8,
};

export const DASHBOARD_STATUS_COUNTS: Record<TaskStatus, number> = {
  backlog: 24,
  scheduled: 8,
  running: 6,
  completed: 39,
  failed: 1,
};

export const DASHBOARD_COMPLETION_TODAY = 82;

export const TASKS: Task[] = [
  {
    id: "task-01",
    title: "Triagem de materiais do turno A",
    status: "running",
    priority: "high",
    due_at: "2026-03-05T16:00:00Z",
    scheduled_at: "2026-03-05T14:30:00Z",
    agent_id: "agent-01",
    created_at: "2026-03-04T13:30:00Z",
    updated_at: "2026-03-05T15:10:00Z",
  },
  {
    id: "task-02",
    title: "Validação de lote R21",
    status: "scheduled",
    priority: "medium",
    due_at: "2026-03-05T19:00:00Z",
    scheduled_at: "2026-03-05T17:00:00Z",
    agent_id: "agent-02",
    created_at: "2026-03-04T16:00:00Z",
    updated_at: "2026-03-05T14:50:00Z",
  },
  {
    id: "task-03",
    title: "Conferir artefatos do projeto Onyx",
    status: "backlog",
    priority: "high",
    due_at: null,
    scheduled_at: null,
    agent_id: null,
    created_at: "2026-03-05T09:00:00Z",
    updated_at: "2026-03-05T09:00:00Z",
  },
  {
    id: "task-04",
    title: "Resumo diário dos agentes",
    status: "completed",
    priority: "low",
    due_at: null,
    scheduled_at: "2026-03-05T11:00:00Z",
    agent_id: "agent-03",
    created_at: "2026-03-04T10:00:00Z",
    updated_at: "2026-03-05T11:20:00Z",
  },
  {
    id: "task-05",
    title: "Reprocessar anexo de cliente",
    status: "failed",
    priority: "high",
    due_at: "2026-03-05T15:00:00Z",
    scheduled_at: "2026-03-05T14:00:00Z",
    agent_id: "agent-04",
    created_at: "2026-03-05T10:00:00Z",
    updated_at: "2026-03-05T14:52:00Z",
  },
  {
    id: "task-06",
    title: "Extração de dados fiscais",
    status: "backlog",
    priority: "medium",
    due_at: null,
    scheduled_at: null,
    agent_id: null,
    created_at: "2026-03-05T08:15:00Z",
    updated_at: "2026-03-05T08:15:00Z",
  },
  {
    id: "task-07",
    title: "Consolidação semanal de KPIs",
    status: "scheduled",
    priority: "low",
    due_at: "2026-03-06T19:30:00Z",
    scheduled_at: "2026-03-06T15:00:00Z",
    agent_id: "agent-05",
    created_at: "2026-03-05T07:50:00Z",
    updated_at: "2026-03-05T08:40:00Z",
  },
  {
    id: "task-08",
    title: "Atualizar índice de arquivos OCR",
    status: "running",
    priority: "medium",
    due_at: "2026-03-05T18:00:00Z",
    scheduled_at: "2026-03-05T15:00:00Z",
    agent_id: "agent-02",
    created_at: "2026-03-05T09:20:00Z",
    updated_at: "2026-03-05T15:08:00Z",
  },
];

export const AGENTS: Agent[] = [
  {
    id: "agent-01",
    name: "Atlas",
    role: "Task planner",
    state: "running",
    current_task_id: "task-01",
    last_seen_at: "2026-03-05T15:19:00Z",
  },
  {
    id: "agent-02",
    name: "Vega",
    role: "Pipeline operator",
    state: "running",
    current_task_id: "task-08",
    last_seen_at: "2026-03-05T15:20:00Z",
  },
  {
    id: "agent-03",
    name: "Nova",
    role: "Reporting analyst",
    state: "idle",
    current_task_id: null,
    last_seen_at: "2026-03-05T15:06:00Z",
  },
  {
    id: "agent-04",
    name: "Orion",
    role: "Validation runner",
    state: "idle",
    current_task_id: null,
    last_seen_at: "2026-03-05T14:52:00Z",
  },
  {
    id: "agent-05",
    name: "Lyra",
    role: "Scheduler",
    state: "idle",
    current_task_id: null,
    last_seen_at: "2026-03-05T14:40:00Z",
  },
  {
    id: "agent-06",
    name: "Echo",
    role: "Archive assistant",
    state: "offline",
    current_task_id: null,
    last_seen_at: "2026-03-05T13:45:00Z",
  },
];

export const AGENTS_ACTIVITY = [
  { id: "a1", agent_name: "Atlas", current_task_title: "Triagem de materiais do turno A", status: "Running", relative_time: "15s ago" },
  { id: "a2", agent_name: "Vega", current_task_title: "Atualizar índice de arquivos OCR", status: "Running", relative_time: "34s ago" },
  { id: "a3", agent_name: "Lyra", current_task_title: "Consolidação semanal de KPIs", status: "Queued", relative_time: "2m ago" },
  { id: "a4", agent_name: "Nova", current_task_title: "Resumo diário dos agentes", status: "Completed", relative_time: "7m ago" },
  { id: "a5", agent_name: "Orion", current_task_title: "Reprocessar anexo de cliente", status: "Failed", relative_time: "18m ago" },
] as const;

export const EXECUTIONS: Execution[] = [
  {
    id: "exec-1",
    task_id: "task-04",
    agent_id: "agent-03",
    result: "success",
    summary: "Resumo consolidado e entregue para revisão.",
    logs_count: 14,
    started_at: "2026-03-05T11:01:00Z",
    ended_at: "2026-03-05T11:20:00Z",
  },
];

export const PLANNING_YEAR: PlanningYear = {
  year: 2026,
  months: [
    { month: 1, planned_tasks: 18, milestones: ["Kickoff"] },
    { month: 2, planned_tasks: 22, milestones: ["Automation v1"] },
    { month: 3, planned_tasks: 26, milestones: ["Ops handoff"] },
    { month: 4, planned_tasks: 24, milestones: [] },
    { month: 5, planned_tasks: 28, milestones: ["Audit"] },
    { month: 6, planned_tasks: 30, milestones: [] },
    { month: 7, planned_tasks: 31, milestones: ["Scale-up"] },
    { month: 8, planned_tasks: 27, milestones: [] },
    { month: 9, planned_tasks: 25, milestones: ["Q3 report"] },
    { month: 10, planned_tasks: 21, milestones: [] },
    { month: 11, planned_tasks: 20, milestones: [] },
    { month: 12, planned_tasks: 19, milestones: ["Annual close"] },
  ],
};

export const PROJECTS: Project[] = [
  {
    id: "project-01",
    name: "Onyx Quality",
    summary: "Fluxo principal de tasks de validação e consolidação.",
    owner: "Nikita Topson",
    status: "active",
    tasks: ["task-01", "task-03", "task-04"],
  },
  {
    id: "project-02",
    name: "Helios Intake",
    summary: "Pipeline de ingestão, OCR e indexação de arquivos.",
    owner: "Mila Araujo",
    status: "active",
    tasks: ["task-02", "task-08"],
  },
  {
    id: "project-03",
    name: "Boreal Reports",
    summary: "Relatórios semanais e anual de performance operacional.",
    owner: "Atlas Team",
    status: "planning",
    tasks: ["task-07"],
  },
];

export const SKILLS_CATALOG: SkillCatalogItem[] = [
  {
    id: "skill-1",
    name: "Batch Scheduler",
    category: "automation",
    description: "Planeja janelas de execução e distribui tasks por prioridade.",
  },
  {
    id: "skill-2",
    name: "Issue Sentinel",
    category: "analysis",
    description: "Detecta anomalias em logs e sinaliza tarefas com risco.",
  },
  {
    id: "skill-3",
    name: "Drive Connector",
    category: "connector",
    description: "Conecta projetos ao storage para leitura e escrita de arquivos.",
  },
  {
    id: "skill-4",
    name: "Report Composer",
    category: "analysis",
    description: "Gera sumários executivos a partir de execuções recentes.",
  },
];

export const PLUGINS: PluginItem[] = [
  { id: "plugin-1", name: "Slack Bridge", status: "installed", version: "1.8.2" },
  { id: "plugin-2", name: "S3 Exporter", status: "available", version: "0.9.6" },
  { id: "plugin-3", name: "Jira Sync", status: "installed", version: "2.1.0" },
];

export const CHAT_THREADS: ChatThread[] = [
  {
    id: "thread-1",
    title: "Daily handoff",
    updated_at: "2026-03-05T15:18:00Z",
    agent_id: "agent-01",
    messages: [
      { id: "m1", role: "user", content: "Status do backlog hoje?", created_at: "2026-03-05T15:12:00Z" },
      { id: "m2", role: "assistant", content: "24 tasks em backlog, 8 prontas para agenda.", created_at: "2026-03-05T15:12:11Z" },
    ],
  },
  {
    id: "thread-2",
    title: "OCR ingest issues",
    updated_at: "2026-03-05T14:56:00Z",
    agent_id: "agent-02",
    messages: [
      { id: "m3", role: "user", content: "Falhas de OCR no lote R21?", created_at: "2026-03-05T14:51:00Z" },
      { id: "m4", role: "assistant", content: "1 arquivo com checksum inconsistente, reprocessando.", created_at: "2026-03-05T14:51:19Z" },
    ],
  },
  {
    id: "thread-3",
    title: "Weekly report draft",
    updated_at: "2026-03-05T13:42:00Z",
    agent_id: "agent-03",
    messages: [
      { id: "m5", role: "user", content: "Pode mandar a minuta do relatório semanal?", created_at: "2026-03-05T13:38:00Z" },
      { id: "m6", role: "assistant", content: "Minuta pronta com destaque de throughput e erros.", created_at: "2026-03-05T13:39:02Z" },
    ],
  },
];

export const FILES: FileRecord[] = [
  { id: "file-1", name: "dashboard-summary.pdf", kind: "document", project_id: "project-01", size: "2.1 MB", updated_at: "2026-03-05T14:40:00Z" },
  { id: "file-2", name: "batch-r21.csv", kind: "dataset", project_id: "project-02", size: "860 KB", updated_at: "2026-03-05T14:55:00Z" },
  { id: "file-3", name: "quality-map.png", kind: "image", project_id: "project-01", size: "1.4 MB", updated_at: "2026-03-05T13:12:00Z" },
  { id: "file-4", name: "agent-atlas-note.wav", kind: "audio", project_id: "project-03", size: "5.9 MB", updated_at: "2026-03-05T12:30:00Z" },
  { id: "file-5", name: "export-logs-0305.txt", kind: "document", project_id: "project-02", size: "310 KB", updated_at: "2026-03-05T15:01:00Z" },
];

export function formatRelativeTime(isoDate: string): string {
  const diffInSeconds = Math.max(1, Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000));

  const value = diffInSeconds < 60
    ? { amount: diffInSeconds, unit: "second" as const }
    : diffInSeconds < 3600
      ? { amount: Math.floor(diffInSeconds / 60), unit: "minute" as const }
      : { amount: Math.floor(diffInSeconds / 3600), unit: "hour" as const };

  try {
    const locale = toIntlLocale(getPersistedLanguage());
    return new Intl.RelativeTimeFormat(locale, { numeric: "always", style: "short" }).format(-value.amount, value.unit);
  } catch {
    if (value.unit === "second") return `${value.amount}s ago`;
    if (value.unit === "minute") return `${value.amount}m ago`;
    return `${value.amount}h ago`;
  }
}
