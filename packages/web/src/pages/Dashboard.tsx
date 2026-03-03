import { useEffect, useState } from "react";
import { Plus, Loader2, Bot } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAgentsStore } from "../stores/agents";
import { Header } from "../components/layout/Header";
import { BottomNav } from "../components/layout/BottomNav";
import { AgentCard } from "../components/agents/AgentCard";
import { CreateAgentDialog } from "../components/agents/CreateAgentDialog";

export function Dashboard() {
  const agents = useAgentsStore((s) => s.agents);
  const loading = useAgentsStore((s) => s.loading);
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);
  const connectSocket = useAgentsStore((s) => s.connectSocket);
  const disconnectSocket = useAgentsStore((s) => s.disconnectSocket);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchAgents();
    connectSocket();
    return () => disconnectSocket();
  }, [fetchAgents, connectSocket, disconnectSocket]);

  return (
    <div className="min-h-screen bg-stone-950 pb-20">
      <Header />

      <main className="px-4">
        {/* Title row */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-stone-400">
            Agents{agents.length > 0 ? ` (${agents.length})` : ""}
          </h2>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            aria-label="Create new agent"
            className="rounded-lg bg-orange-500 p-1.5 text-white transition-all duration-200 hover:bg-orange-600 hover:shadow-md active:scale-[0.95]"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          </div>
        ) : agents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="rounded-xl border border-white/5 bg-stone-900/80 backdrop-blur-sm p-4 mb-4">
              <Bot className="h-8 w-8 text-stone-600" />
            </div>
            <p className="text-sm font-medium text-stone-400">No agents yet</p>
            <p className="text-xs text-stone-500 mt-1">
              Create your first agent to get started
            </p>
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="mt-4 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-orange-600 hover:shadow-md active:scale-[0.98]"
            >
              Create Agent
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid gap-3">
              {agents.map((agent, i) => (
                <AgentCard key={agent.id} agent={agent} index={i} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>

      {/* FAB for mobile — visible only on small screens when agents exist */}
      {agents.length > 0 && (
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          aria-label="Create new agent"
          className="fixed bottom-20 right-4 z-30 rounded-full bg-orange-500 p-3.5 text-white shadow-lg transition-all duration-200 hover:bg-orange-600 hover:shadow-xl active:scale-[0.95] sm:hidden"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}

      <CreateAgentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />

      <BottomNav />
    </div>
  );
}
