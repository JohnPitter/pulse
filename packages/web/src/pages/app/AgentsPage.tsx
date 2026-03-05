import { useEffect, useState } from "react";
import { Plus, Bot } from "lucide-react";
import { useAgentsStore, type Agent } from "../../stores/agents";
import { AgentFormDialog } from "../../components/agents/AgentFormDialog";

export function AgentsPage() {
  const agents = useAgentsStore((s) => s.agents);
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);
  const connectSocket = useAgentsStore((s) => s.connectSocket);
  const disconnectSocket = useAgentsStore((s) => s.disconnectSocket);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);

  useEffect(() => {
    fetchAgents();
    connectSocket();
    return () => disconnectSocket();
  }, [fetchAgents, connectSocket, disconnectSocket]);

  const statusColor: Record<string, string> = {
    running: "bg-success", waiting: "bg-warning",
    idle: "bg-border-strong", stopped: "bg-border-strong", error: "bg-danger",
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] text-text-secondary">{agents.length} agents configured</p>
        <button type="button" onClick={() => setDialogOpen(true)} className="btn btn-primary px-4 py-2 text-[13px]">
          <Plus className="h-3.5 w-3.5" /> New Agent
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="h-14 w-14 rounded-2xl border border-border bg-surface flex items-center justify-center">
            <Bot className="h-6 w-6 text-text-disabled" />
          </div>
          <p className="text-[14px] font-semibold text-text-primary">No agents yet</p>
          <p className="text-[13px] text-text-secondary">Create your first agent to get started.</p>
          <button type="button" onClick={() => setDialogOpen(true)} className="btn btn-primary px-5 py-2.5">
            <Plus className="h-4 w-4" /> Create Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {agents.map((agent) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => setEditAgent(agent)}
              className="bg-surface border border-border/50 rounded-2xl p-4 text-left shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-panel)] hover:border-border transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className={`h-2 w-2 rounded-full shrink-0 ${statusColor[agent.status] ?? "bg-border-strong"}`} />
                <span className="text-[14px] font-semibold text-text-primary truncate">{agent.name}</span>
              </div>
              <p className="text-[11px] text-text-disabled truncate">{agent.projectPath}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="badge badge-neutral capitalize">{agent.model}</span>
                <span className="badge badge-neutral capitalize">{agent.status}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <AgentFormDialog
        open={dialogOpen || !!editAgent}
        onClose={() => { setDialogOpen(false); setEditAgent(null); }}
        agent={editAgent}
      />
    </div>
  );
}
