import { useMemo, useState } from "react";
import { ArrowUpRight, FolderKanban } from "lucide-react";
import { PROJECTS, TASKS } from "./mockData";
import { useShellQuery } from "./useShellQuery";
import { useI18n } from "../../i18n";

const CARD_CLASS =
  "rounded-[20px] border border-black/6 bg-[#F1EFEC] shadow-[0_8px_18px_rgba(0,0,0,0.06)]";

const PROJECT_STATUS: Record<string, string> = {
  active: "bg-success-light text-success",
  paused: "bg-warning-light text-warning",
  planning: "bg-info-light text-info",
};

const PROJECT_STATUS_KEYS: Record<string, string> = {
  active: "statuses.active",
  paused: "statuses.paused",
  planning: "statuses.planning",
};

export function ProjectsPage() {
  const query = useShellQuery();
  const [selectedProjectId, setSelectedProjectId] = useState(PROJECTS[0]?.id ?? "");
  const { t } = useI18n();

  const filteredProjects = useMemo(
    () =>
      PROJECTS.filter((project) => {
        const content = `${project.name} ${project.summary}`.toLowerCase();
        return !query || content.includes(query);
      }),
    [query],
  );

  const selectedProject =
    filteredProjects.find((project) => project.id === selectedProjectId) ?? filteredProjects[0] ?? null;

  const projectTasks = useMemo(() => {
    if (!selectedProject) return [];
    return TASKS.filter((task) => selectedProject.tasks.includes(task.id));
  }, [selectedProject]);

  const grouped = useMemo(
    () => ({
      backlog: projectTasks.filter((task) => task.status === "backlog"),
      running: projectTasks.filter((task) => task.status === "running"),
      done: projectTasks.filter((task) => task.status === "completed"),
    }),
    [projectTasks],
  );

  return (
    <div className="grid h-full min-h-[520px] grid-cols-1 gap-3 xl:grid-cols-[0.32fr_0.3fr_0.38fr] animate-fade-in">
      <section className={`${CARD_CLASS} min-h-0 p-4 animate-fade-up stagger-1`}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-neutral-fg1">{t("routes.projects")}</h2>
            <p className="text-[12px] text-neutral-fg2">{t("projectsPage.projectList")}</p>
          </div>
          <FolderKanban className="h-4 w-4 text-neutral-fg3" />
        </div>

        <div className="space-y-1.5">
          {filteredProjects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => setSelectedProjectId(project.id)}
              className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
                project.id === selectedProject?.id
                  ? "border-brand/35 bg-neutral-bg2"
                  : "border-transparent hover:border-stroke hover:bg-neutral-bg2/75"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-neutral-fg1">{project.name}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${PROJECT_STATUS[project.status]}`}>
                  {t(PROJECT_STATUS_KEYS[project.status] ?? project.status)}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] text-neutral-fg2">{project.summary}</p>
            </button>
          ))}
        </div>
      </section>

      <section className={`${CARD_CLASS} min-h-0 p-4 animate-fade-up stagger-2`}>
        <div className="mb-3">
          <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-neutral-fg1">{t("projectsPage.projectOverview")}</h3>
          <p className="text-[12px] text-neutral-fg2">{t("projectsPage.projectOverview")}</p>
        </div>

        {selectedProject ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-black/5 bg-[#ECE9E4] p-3">
              <p className="text-[10px] uppercase tracking-wide text-neutral-fg3">{t("projectsPage.project")}</p>
              <p className="text-[14px] font-semibold text-neutral-fg1">{selectedProject.name}</p>
              <p className="mt-1 text-[11px] text-neutral-fg2">{selectedProject.summary}</p>
            </div>

            <div className="rounded-2xl border border-black/5 bg-[#ECE9E4] p-3">
              <p className="text-[10px] uppercase tracking-wide text-neutral-fg3">{t("projectsPage.owner")}</p>
              <p className="text-[13px] font-semibold text-neutral-fg1">{selectedProject.owner}</p>
            </div>

            <div className="rounded-2xl border border-black/5 bg-[#ECE9E4] p-3">
              <p className="text-[10px] uppercase tracking-wide text-neutral-fg3">{t("projectsPage.taskScope")}</p>
              <p className="text-[13px] font-semibold text-neutral-fg1">{t("projectsPage.tasksLinked", { count: projectTasks.length })}</p>
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-1 rounded-lg border border-stroke bg-neutral-bg2 px-2.5 py-1 text-[11px] text-neutral-fg1 hover:bg-neutral-bg3"
              >
                {t("projectsPage.openBoard")}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex h-[240px] items-center justify-center rounded-2xl border border-dashed border-stroke bg-neutral-bg2/70">
            <p className="text-[12px] text-neutral-fg3">{t("projectsPage.noMatch")}</p>
          </div>
        )}
      </section>

      <section className={`${CARD_CLASS} min-h-0 p-4 animate-fade-up stagger-3`}>
        <div className="mb-3">
          <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-neutral-fg1">{t("projectsPage.tasksBoard")}</h3>
          <p className="text-[12px] text-neutral-fg2">{t("projectsPage.tasksBoard")}</p>
        </div>

        <div className="grid h-[100%] min-h-[360px] grid-cols-3 gap-2">
          <StatusColumn title={t("projectsPage.backlog")} items={grouped.backlog} />
          <StatusColumn title={t("projectsPage.running")} items={grouped.running} />
          <StatusColumn title={t("projectsPage.done")} items={grouped.done} />
        </div>
      </section>
    </div>
  );
}

function StatusColumn({ title, items }: { title: string; items: typeof TASKS }) {
  return (
    <div className="min-h-0 rounded-2xl border border-black/5 bg-[#ECE9E4] p-2">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold text-neutral-fg1">{title}</p>
        <span className="rounded-full bg-neutral-bg2 px-1.5 py-0.5 text-[10px] text-neutral-fg2">
          {items.length}
        </span>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-stroke bg-neutral-bg2 px-2 py-1.5">
            <p className="line-clamp-2 text-[11px] font-medium text-neutral-fg1">{item.title}</p>
            <span className="mt-1 inline-flex rounded-full bg-neutral-bg3 px-1.5 py-0.5 text-[9px] uppercase text-neutral-fg2">
              {item.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
