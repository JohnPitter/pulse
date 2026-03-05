import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const SUPPORTED_LANGUAGES = ["en", "pt-BR"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = "pulse:language";

const EN_TRANSLATIONS = {
  common: {
    productName: "Pulse",
    language: "Language",
    english: "English",
    portugueseBrazil: "Português (Brasil)",
    cancel: "Cancel",
    close: "Close",
    back: "Back",
  },
  nav: {
    dashboard: "Dashboard",
    agents: "Agents",
    projects: "Projects",
    skillsPlugins: "Skills & Plugins",
    chat: "Chat",
    files: "Files",
    settings: "Settings",
  },
  routes: {
    generalOverview: "General overview",
    agents: "Agents",
    projects: "Projects",
    skillsPlugins: "Skills & plugins",
    chat: "Chat",
    files: "Files",
    settings: "Settings",
  },
  splash: {
    subtitle: "Remote Agent Manager",
  },
  topbar: {
    searchPlaceholder: "Search in Pulse...",
    notifications: "Notifications",
    reportIssueTooltip: "Signal a problem to developers",
    reportIssueTitle: "Report issue",
    reportIssueSubtitle: "Signal a problem to developers",
    reportIssuePlaceholder: "Describe what happened...",
    sendReport: "Send report",
    sent: "Sent",
    settings: "Settings",
    profile: "Profile",
    signOut: "Sign out",
    notificationsItems: {
      n1: "Agent Atlas finished nightly summary",
      n2: "Task schedule conflict detected",
      n3: "Files sync completed",
    },
    timeAgo2m: "2m ago",
    timeAgo8m: "8m ago",
    timeAgo21m: "21m ago",
    languageSelectorLabel: "Display language",
  },
  landing: {
    productSubtitle: "Operations cockpit",
    signIn: "Sign in",
    openApp: "Open app",
    heroBadge: "Multi-agent operations",
    heroTitle: "Keep every task, agent and project in one live control surface.",
    heroDescription:
      "Pulse unifies planning, execution and review with a compact dashboard shell built for day-to-day operations.",
    getStarted: "Get started",
    viewDemo: "View demo",
    dashboardPreview: "Dashboard preview",
    dashboardPreviewSubtitle: "General overview",
    trustBadge: "Built for high-output operations teams",
    imageCard1Title: "Live orchestration",
    imageCard1Text: "Live rows from Agents activity with running, queued and completed statuses.",
    imageCard2Title: "Execution evidence",
    imageCard2Text: "Last task panel with task, agent, result and direct log access.",
    imageCard3Title: "Decision-ready dashboards",
    imageCard3Text: "Tasks by status bars with completion metric for fast decisions.",
    featuresTitle: "Features",
    featuresSubtitle: "Cards aligned with the app surface language.",
    featureAgents: "Control agent pool, roles and execution states.",
    featureTasks: "Plan, schedule and monitor operational tasks.",
    featureProjects: "Organize initiatives and align task boards.",
    featureSkills: "Attach capabilities and integrations per workspace.",
    featureChat: "Coordinate with agents through focused threads.",
    featureFiles: "Store artifacts and inspect outputs in one place.",
    howItWorksTitle: "How it works",
    howItWorksSubtitle: "Timeline/steps in minimal cards and chips.",
    step1: "Create project",
    step2: "Add tasks",
    step3: "Assign agents",
    step4: "Run + monitor",
    step5: "Review outputs",
    stepLabel: "Step {step}",
    ctaTitle: "Build your next workflow in Pulse.",
    ctaText: "Start with the dashboard, then expand into projects, files and agent activity.",
  },
  demo: {
    subtitle: "Interactive product demo",
    title: "See Pulse in action before entering the workspace.",
    description:
      "This demo highlights the same dashboard modules used in the application, with realistic backlog, status and execution views.",
    openDashboard: "Open dashboard",
    backToHome: "Back to home",
    pointBacklogTitle: "Backlog planning",
    pointBacklogText: "Track next due, backlog size and ready-to-run tasks in one card.",
    pointStatusTitle: "Status analytics",
    pointStatusText: "Compare workload across backlog, scheduled, running, completed and failed.",
    pointExecutionTitle: "Execution traceability",
    pointExecutionText: "Open the latest run details and logs directly from the Last task module.",
  },
  login: {
    subtitle: "Multi-agent orchestrator",
    setupSubtitle: "Setup",
    signInTitle: "Sign in",
    signInDescription: "Enter your admin password to continue.",
    password: "Password",
    signInButton: "Sign in",
    signingIn: "Signing in...",
    createPasswordTitle: "Create password",
    createPasswordDescription: "Set an admin password for this instance.",
    confirm: "Confirm",
    passwordsDoNotMatch: "Passwords do not match",
    setPassword: "Set Password",
    settingUp: "Setting up...",
    atLeast6: "At least 6 characters",
    repeatPassword: "Repeat password",
  },
  dashboard: {
    backlog: "Backlog",
    tasksToSchedule: "Tasks to schedule",
    nextDue: "Next due",
    backlogSize: "Backlog size",
    readyToRun: "Ready to run",
    tasksSuffix: "tasks",
    addTask: "Add task",
    schedule: "Schedule",
    annualPlanning: "Annual planning",
    yearTimeline: "Year timeline",
    tasksByStatus: "Tasks by status",
    workloadOverview: "Overview of current workload",
    systemNominal: "System nominal",
    attentionNeeded: "Attention needed",
    degraded: "Degraded",
    completionToday: "Completion today",
    viewReport: "View report",
    agentsActivity: "Agents activity",
    liveActivityFeed: "Live activity feed",
    lastTask: "Last task",
    mostRecentExecution: "Most recent execution",
    taskDetails: "Task details",
    task: "Task",
    agent: "Agent",
    result: "Result",
    logs: "logs",
    openLogs: "Open logs",
    success: "Success",
    noAgents: "No agents registered yet",
    noExecutions: "No executions recorded yet",
    addTaskTitle: "New task",
    taskTitle: "Title",
    taskTitlePlaceholder: "Describe the task...",
    priority: "Priority",
    priorityLow: "Low",
    priorityMedium: "Medium",
    priorityHigh: "High",
    dueDate: "Due date",
    creating: "Creating...",
    create: "Create",
    scheduleTaskTitle: "Schedule task",
    scheduleTaskSubtitle: "Pick a backlog task and set a date",
    selectTask: "Select task",
    scheduledFor: "Schedule for",
    scheduling: "Scheduling...",
    noBacklogTasks: "No backlog tasks available",
    monthNames: "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec",
  },
  statuses: {
    running: "Running",
    queued: "Queued",
    waiting: "Waiting",
    completed: "Completed",
    failed: "Failed",
    idle: "Idle",
    offline: "Offline",
    active: "Active",
    paused: "Paused",
    planning: "Planning",
    installed: "Installed",
    available: "Available",
  },
  agentsPage: {
    recordsActive: "{count} active records",
    tableOrCards: "Agent roster — table and card view",
    noActiveTask: "No active task",
    detail: "Agent detail",
    detailDrawer: "Details for selected agent",
    lastSeen: "Last seen {time}",
    currentTask: "Current task",
    noTaskRunning: "No task running",
    status: "Status",
    quickActions: "Quick actions",
    openTimeline: "Open timeline",
    assignTasks: "Assign tasks",
    noMatch: "No agent matches current search.",
  },
  projectsPage: {
    projectList: "Registered projects",
    projectOverview: "Project overview",
    tasksBoard: "Tasks board",
    project: "Project",
    owner: "Owner",
    taskScope: "Task scope",
    tasksLinked: "{count} tasks linked",
    openBoard: "Open board",
    noMatch: "No project matches current search.",
    backlog: "Backlog",
    running: "Running",
    done: "Done",
  },
  skillsPage: {
    skillsAndPlugins: "Skills & plugins",
    skillsCatalog: "Registered skills catalog",
    install: "Install",
    pluginCards: "Plugin cards",
    pluginCardsSubtitle: "Installed plugins",
    installPlugin: "Install plugin",
    installModalSubtitle: "Add from marketplace or local",
    pluginName: "Plugin name",
    source: "Source",
    marketplace: "Marketplace",
    categoryAutomation: "Automation",
    categoryAnalysis: "Analysis",
    categoryConnector: "Connector",
    github: "GitHub",
    localPackage: "Local package",
    installing: "Installing...",
    installPluginButton: "Install plugin",
    closeInstallModal: "Close install modal",
    version: "Version",
    typeTool: "Tool",
    typePrompt: "Prompt",
    typeMcp: "MCP",
    noSkills: "No skills registered yet.",
    enabledByDefault: "Enabled by default",
  },
  chatPage: {
    threads: "Threads",
    threadList: "Recent conversations",
    chatPanel: "Chat panel",
    chatPanelSubtitle: "Conversation messages",
    noThreadMatch: "No thread matches current search.",
    typeMessage: "Type message...",
    agentSelector: "Agent selector",
    agentSelectorSubtitle: "Pick agent to chat",
    noMessages: "No messages yet. Start a conversation.",
  },
  filesPage: {
    files: "Files",
    fileGridFilters: "Browse and filter files",
    previewPanel: "Preview panel",
    previewPanelSubtitle: "File details and preview",
    noFileMatch: "No file matches current filters.",
    openFile: "Open file",
    file: "File",
    type: "Type",
    size: "Size",
    project: "Project",
    unlinked: "Unlinked",
    all: "All",
    image: "Image",
    document: "Document",
    audio: "Audio",
    dataset: "Dataset",
    goUp: "Go up",
  },
  time: {
    secondsAgo: "{value}s ago",
    minutesAgo: "{value}m ago",
    hoursAgo: "{value}h ago",
  },
};

const PT_BR_TRANSLATIONS: typeof EN_TRANSLATIONS = {
  common: {
    productName: "Pulse",
    language: "Idioma",
    english: "English",
    portugueseBrazil: "Português (Brasil)",
    cancel: "Cancelar",
    close: "Fechar",
    back: "Voltar",
  },
  nav: {
    dashboard: "Dashboard",
    agents: "Agentes",
    projects: "Projetos",
    skillsPlugins: "Skills e Plugins",
    chat: "Chat",
    files: "Arquivos",
    settings: "Configurações",
  },
  routes: {
    generalOverview: "Visão geral",
    agents: "Agentes",
    projects: "Projetos",
    skillsPlugins: "Skills e plugins",
    chat: "Chat",
    files: "Arquivos",
    settings: "Configurações",
  },
  splash: {
    subtitle: "Gerenciador de Agentes Remotos",
  },
  topbar: {
    searchPlaceholder: "Buscar no Pulse...",
    notifications: "Notificações",
    reportIssueTooltip: "Sinalizar um problema para os desenvolvedores",
    reportIssueTitle: "Reportar problema",
    reportIssueSubtitle: "Sinalize um problema para os desenvolvedores",
    reportIssuePlaceholder: "Descreva o que aconteceu...",
    sendReport: "Enviar reporte",
    sent: "Enviado",
    settings: "Configurações",
    profile: "Perfil",
    signOut: "Sair",
    notificationsItems: {
      n1: "Agente Atlas concluiu o resumo noturno",
      n2: "Conflito de agendamento de task detectado",
      n3: "Sincronização de arquivos concluída",
    },
    timeAgo2m: "há 2m",
    timeAgo8m: "há 8m",
    timeAgo21m: "há 21m",
    languageSelectorLabel: "Idioma da interface",
  },
  landing: {
    productSubtitle: "Cockpit operacional",
    signIn: "Entrar",
    openApp: "Abrir app",
    heroBadge: "Operações multiagente",
    heroTitle: "Mantenha cada task, agente e projeto em uma única superfície de controle ao vivo.",
    heroDescription:
      "Pulse unifica planejamento, execução e revisão em um dashboard compacto para operações do dia a dia.",
    getStarted: "Começar",
    viewDemo: "Ver demo",
    dashboardPreview: "Prévia do dashboard",
    dashboardPreviewSubtitle: "Visão geral",
    trustBadge: "Construído para times de operações de alta performance",
    imageCard1Title: "Orquestração ao vivo",
    imageCard1Text: "Linhas ao vivo da atividade dos agentes com status rodando, fila e concluido.",
    imageCard2Title: "Evidência de execução",
    imageCard2Text: "Painel da ultima task com task, agente, resultado e acesso direto aos logs.",
    imageCard3Title: "Dashboards para decisão",
    imageCard3Text: "Barras de tasks por status com métrica de conclusão para decisão rápida.",
    featuresTitle: "Funcionalidades",
    featuresSubtitle: "Cards alinhados com a linguagem visual do app.",
    featureAgents: "Controle pool de agentes, papéis e estados de execução.",
    featureTasks: "Planeje, agende e monitore tarefas operacionais.",
    featureProjects: "Organize iniciativas e alinhe quadros de tarefas.",
    featureSkills: "Conecte capacidades e integrações por workspace.",
    featureChat: "Coordene com agentes por threads focadas.",
    featureFiles: "Guarde artefatos e revise saídas em um só lugar.",
    howItWorksTitle: "Como funciona",
    howItWorksSubtitle: "Linha do tempo/etapas em cards e chips mínimos.",
    step1: "Criar projeto",
    step2: "Adicionar tasks",
    step3: "Atribuir agentes",
    step4: "Executar + monitorar",
    step5: "Revisar resultados",
    stepLabel: "Etapa {step}",
    ctaTitle: "Construa seu próximo fluxo no Pulse.",
    ctaText: "Comece pelo dashboard e expanda para projetos, arquivos e atividade dos agentes.",
  },
  demo: {
    subtitle: "Demo interativa do produto",
    title: "Veja o Pulse em ação antes de entrar no workspace.",
    description:
      "Esta demo destaca os mesmos módulos do dashboard usados na aplicação, com visual realista de backlog, status e execuções.",
    openDashboard: "Abrir dashboard",
    backToHome: "Voltar para home",
    pointBacklogTitle: "Planejamento de backlog",
    pointBacklogText: "Acompanhe próxima entrega, tamanho do backlog e tasks prontas para execução em um card.",
    pointStatusTitle: "Análise por status",
    pointStatusText: "Compare a carga entre backlog, agendadas, em execução, concluídas e falhas.",
    pointExecutionTitle: "Rastreabilidade de execução",
    pointExecutionText: "Abra detalhes e logs da execução mais recente direto no módulo Last task.",
  },
  login: {
    subtitle: "Orquestrador multiagente",
    setupSubtitle: "Configuração",
    signInTitle: "Entrar",
    signInDescription: "Digite sua senha de administrador para continuar.",
    password: "Senha",
    signInButton: "Entrar",
    signingIn: "Entrando...",
    createPasswordTitle: "Criar senha",
    createPasswordDescription: "Defina uma senha de administrador para esta instância.",
    confirm: "Confirmar",
    passwordsDoNotMatch: "As senhas não coincidem",
    setPassword: "Definir senha",
    settingUp: "Configurando...",
    atLeast6: "Pelo menos 6 caracteres",
    repeatPassword: "Repita a senha",
  },
  dashboard: {
    backlog: "Backlog",
    tasksToSchedule: "Tasks para agendar",
    nextDue: "Próxima entrega",
    backlogSize: "Tamanho do backlog",
    readyToRun: "Prontas para rodar",
    tasksSuffix: "tasks",
    addTask: "Adicionar task",
    schedule: "Agendar",
    annualPlanning: "Planejamento anual",
    yearTimeline: "Linha do ano",
    tasksByStatus: "Tasks por status",
    workloadOverview: "Visão da carga atual",
    systemNominal: "Sistema nominal",
    attentionNeeded: "Atenção necessária",
    degraded: "Degradado",
    completionToday: "Conclusão hoje",
    viewReport: "Ver relatório",
    agentsActivity: "Atividade dos agentes",
    liveActivityFeed: "Feed ao vivo",
    lastTask: "Última task",
    mostRecentExecution: "Execução mais recente",
    taskDetails: "Detalhes da task",
    task: "Task",
    agent: "Agente",
    result: "Resultado",
    logs: "logs",
    openLogs: "Abrir logs",
    success: "Sucesso",
    noAgents: "Nenhum agente registrado",
    noExecutions: "Nenhuma execução registrada",
    addTaskTitle: "Nova task",
    taskTitle: "Título",
    taskTitlePlaceholder: "Descreva a task...",
    priority: "Prioridade",
    priorityLow: "Baixa",
    priorityMedium: "Média",
    priorityHigh: "Alta",
    dueDate: "Data de entrega",
    creating: "Criando...",
    create: "Criar",
    scheduleTaskTitle: "Agendar task",
    scheduleTaskSubtitle: "Escolha uma task do backlog e defina a data",
    selectTask: "Selecionar task",
    scheduledFor: "Agendar para",
    scheduling: "Agendando...",
    noBacklogTasks: "Sem tasks no backlog",
    monthNames: "Jan,Fev,Mar,Abr,Mai,Jun,Jul,Ago,Set,Out,Nov,Dez",
  },
  statuses: {
    running: "Rodando",
    queued: "Na fila",
    waiting: "Aguardando",
    completed: "Concluído",
    failed: "Falhou",
    idle: "Inativo",
    offline: "Offline",
    active: "Ativo",
    paused: "Pausado",
    planning: "Planejamento",
    installed: "Instalado",
    available: "Disponível",
  },
  agentsPage: {
    recordsActive: "{count} registros ativos",
    tableOrCards: "Painel de agentes — tabela e cards",
    noActiveTask: "Sem task ativa",
    detail: "Detalhe do agente",
    detailDrawer: "Detalhes do agente selecionado",
    lastSeen: "Visto por último às {time}",
    currentTask: "Task atual",
    noTaskRunning: "Nenhuma task em execução",
    status: "Status",
    quickActions: "Ações rápidas",
    openTimeline: "Abrir timeline",
    assignTasks: "Atribuir tasks",
    noMatch: "Nenhum agente corresponde à busca atual.",
  },
  projectsPage: {
    projectList: "Projetos registrados",
    projectOverview: "Visão geral do projeto",
    tasksBoard: "Quadro de tasks",
    project: "Projeto",
    owner: "Responsável",
    taskScope: "Escopo de tasks",
    tasksLinked: "{count} tasks vinculadas",
    openBoard: "Abrir quadro",
    noMatch: "Nenhum projeto corresponde à busca atual.",
    backlog: "Backlog",
    running: "Rodando",
    done: "Concluído",
  },
  skillsPage: {
    skillsAndPlugins: "Skills e plugins",
    skillsCatalog: "Catálogo de skills registradas",
    install: "Instalar",
    pluginCards: "Cards de plugin",
    pluginCardsSubtitle: "Plugins instalados",
    installPlugin: "Instalar plugin",
    installModalSubtitle: "Adicionar do marketplace ou local",
    pluginName: "Nome do plugin",
    source: "Origem",
    marketplace: "Marketplace",
    categoryAutomation: "Automação",
    categoryAnalysis: "Análise",
    categoryConnector: "Conector",
    github: "GitHub",
    localPackage: "Pacote local",
    installing: "Instalando...",
    installPluginButton: "Instalar plugin",
    closeInstallModal: "Fechar modal de instalação",
    version: "Versão",
    typeTool: "Ferramenta",
    typePrompt: "Prompt",
    typeMcp: "MCP",
    noSkills: "Nenhuma skill registrada.",
    enabledByDefault: "Ativa por padrão",
  },
  chatPage: {
    threads: "Threads",
    threadList: "Conversas recentes",
    chatPanel: "Painel de chat",
    chatPanelSubtitle: "Mensagens da conversa",
    noThreadMatch: "Nenhuma thread corresponde à busca atual.",
    typeMessage: "Digite uma mensagem...",
    agentSelector: "Seletor de agente",
    agentSelectorSubtitle: "Escolha o agente para conversar",
    noMessages: "Sem mensagens. Inicie uma conversa.",
  },
  filesPage: {
    files: "Arquivos",
    fileGridFilters: "Navegue e filtre arquivos",
    previewPanel: "Painel de preview",
    previewPanelSubtitle: "Detalhes e preview do arquivo",
    noFileMatch: "Nenhum arquivo corresponde aos filtros atuais.",
    openFile: "Abrir arquivo",
    file: "Arquivo",
    type: "Tipo",
    size: "Tamanho",
    project: "Projeto",
    unlinked: "Sem vínculo",
    all: "Todos",
    image: "Imagem",
    document: "Documento",
    audio: "Áudio",
    dataset: "Dataset",
    goUp: "Voltar",
  },
  time: {
    secondsAgo: "há {value}s",
    minutesAgo: "há {value}m",
    hoursAgo: "há {value}h",
  },
};

const DICTIONARIES: Record<SupportedLanguage, typeof EN_TRANSLATIONS> = {
  en: EN_TRANSLATIONS,
  "pt-BR": PT_BR_TRANSLATIONS,
};

type InterpolationParams = Record<string, string | number>;

interface I18nContextValue {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string, params?: InterpolationParams) => string;
  supportedLanguages: readonly SupportedLanguage[];
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function resolveObjectPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === "object" && segment in acc) {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
}

function interpolate(template: string, params?: InterpolationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}

function normalizeLanguage(value: string | null | undefined): SupportedLanguage | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized.startsWith("pt")) return "pt-BR";
  if (normalized.startsWith("en")) return "en";
  return null;
}

function detectLanguageFromSystem(): SupportedLanguage {
  if (typeof navigator === "undefined") return "en";

  const candidates = [
    ...(navigator.languages ?? []),
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().locale,
  ];

  for (const candidate of candidates) {
    const mapped = normalizeLanguage(candidate);
    if (mapped) return mapped;
  }

  return "en";
}

function getInitialLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return "en";

  const stored = normalizeLanguage(window.localStorage.getItem(STORAGE_KEY));
  if (stored) return stored;

  return detectLanguageFromSystem();
}

export function getPersistedLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return "en";
  const stored = normalizeLanguage(window.localStorage.getItem(STORAGE_KEY));
  if (stored) return stored;
  return detectLanguageFromSystem();
}

export function toIntlLocale(language: SupportedLanguage): string {
  return language === "pt-BR" ? "pt-BR" : "en-US";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(getInitialLanguage);

  const setLanguage = useCallback((next: SupportedLanguage) => {
    setLanguageState(next);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, language);
    }
  }, [language]);

  const t = useCallback(
    (key: string, params?: InterpolationParams) => {
      const value = resolveObjectPath(DICTIONARIES[language], key);
      const fallback = resolveObjectPath(DICTIONARIES.en, key);
      const resolved = typeof value === "string" ? value : typeof fallback === "string" ? fallback : key;
      return interpolate(resolved, params);
    },
    [language],
  );

  const contextValue = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t,
      supportedLanguages: SUPPORTED_LANGUAGES,
    }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
