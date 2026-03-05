import { useEffect } from "react";
import { useAgentsStore } from "../../stores/agents";
import { useTasksStore } from "../../stores/tasks";
import { useDashboardStore } from "../../stores/dashboard";
import { BacklogCard } from "../../components/dashboard/BacklogCard";
import { AnnualPlanningCard } from "../../components/dashboard/AnnualPlanningCard";
import { TasksByStatusCard } from "../../components/dashboard/TasksByStatusCard";
import { AgentsActivityCard } from "../../components/dashboard/AgentsActivityCard";
import { LastTaskCard } from "../../components/dashboard/LastTaskCard";

export function DashboardPage() {
  const agents = useAgentsStore((s) => s.agents);
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);
  const connectSocket = useAgentsStore((s) => s.connectSocket);
  const disconnectSocket = useAgentsStore((s) => s.disconnectSocket);

  const tasks = useTasksStore((s) => s.tasks);
  const fetchTasks = useTasksStore((s) => s.fetchTasks);

  const { stats, lastExecution, fetch: fetchDashboard } = useDashboardStore();

  useEffect(() => {
    fetchAgents();
    fetchTasks();
    fetchDashboard();
    connectSocket();

    const interval = setInterval(fetchDashboard, 30_000);
    return () => {
      clearInterval(interval);
      disconnectSocket();
    };
  }, [fetchAgents, fetchTasks, fetchDashboard, connectSocket, disconnectSocket]);

  return (
    /*
     * Grid mirrors reference image geometry:
     * - Left column (38%): tall BacklogCard + bottom AnnualPlanningCard
     * - Right column (62%): top TasksByStatusCard + two bottom cards
     */
    <div className="h-full grid grid-cols-[38%_1fr] gap-3">

      {/* ── Left tall card ── */}
      <div className="flex flex-col gap-3 min-h-0">
        <div className="flex-1 bg-surface rounded-2xl p-4 shadow-[var(--shadow-card)] border border-border/50 min-h-0">
          <BacklogCard tasks={tasks} />
        </div>
        <div className="bg-surface rounded-2xl p-4 shadow-[var(--shadow-card)] border border-border/50" style={{ height: "200px" }}>
          <AnnualPlanningCard tasks={tasks} />
        </div>
      </div>

      {/* ── Right column ── */}
      <div className="flex flex-col gap-3 min-h-0">
        <div className="flex-1 bg-surface rounded-2xl p-5 shadow-[var(--shadow-card)] border border-border/50 min-h-0">
          <TasksByStatusCard stats={stats} />
        </div>
        <div className="grid grid-cols-2 gap-3" style={{ height: "220px" }}>
          <div className="bg-surface rounded-2xl p-4 shadow-[var(--shadow-card)] border border-border/50 overflow-hidden">
            <AgentsActivityCard agents={agents} />
          </div>
          <div className="bg-surface rounded-2xl p-4 shadow-[var(--shadow-card)] border border-border/50">
            <LastTaskCard execution={lastExecution} />
          </div>
        </div>
      </div>
    </div>
  );
}
