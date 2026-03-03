import { useCallback, useEffect, useRef, useState } from "react";
import { Monitor, Loader2 } from "lucide-react";
import { useAgentsStore } from "../stores/agents";
import { onEvent, emitEvent } from "../stores/socket";
import { AgentSidebar } from "../components/sidebar/AgentSidebar";
import { TerminalView } from "../components/terminal/TerminalView";
import { TerminalInfoBar } from "../components/terminal/TerminalInfoBar";
import { TerminalStatusBar } from "../components/terminal/TerminalStatusBar";
import { CreateAgentDialog } from "../components/agents/CreateAgentDialog";

const CONTEXT_RE = /context:\s*([\d.]+k?)\s*\/\s*([\d.]+k?)/i;

export function Dashboard() {
  const agents = useAgentsStore((s) => s.agents);
  const loading = useAgentsStore((s) => s.loading);
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);
  const connectSocket = useAgentsStore((s) => s.connectSocket);
  const disconnectSocket = useAgentsStore((s) => s.disconnectSocket);

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cliVersion, setCliVersion] = useState<string | null>(null);
  const [contextUsage, setContextUsage] = useState<string | null>(null);

  // Track previous agent to clear context usage on switch
  const prevAgentRef = useRef<string | null>(null);

  // Fetch agents + connect socket on mount
  useEffect(() => {
    fetchAgents();
    connectSocket();
    return () => disconnectSocket();
  }, [fetchAgents, connectSocket, disconnectSocket]);

  // Fetch CLI version once
  useEffect(() => {
    fetch("/api/system/version", { credentials: "include" })
      .then((r) => r.json())
      .then((data: { version: string }) => setCliVersion(data.version))
      .catch(() => setCliVersion("unknown"));
  }, []);

  // Parse context usage from terminal output
  useEffect(() => {
    if (!selectedAgentId) return;

    // Clear on agent switch
    if (prevAgentRef.current !== selectedAgentId) {
      setContextUsage(null);
      prevAgentRef.current = selectedAgentId;
    }

    const unsub = onEvent("terminal:output", (data: unknown) => {
      const payload = data as { agentId: string; data: string };
      if (payload.agentId !== selectedAgentId) return;
      const match = CONTEXT_RE.exec(payload.data);
      if (match) {
        setContextUsage(`${match[1]} / ${match[2]}`);
      }
    });

    return unsub;
  }, [selectedAgentId]);

  const createAgent = useAgentsStore((s) => s.createAgent);

  const handleSelectAgent = useCallback((id: string) => {
    setSelectedAgentId(id);
  }, []);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? null;

  const handleToggleAgent = useCallback(() => {
    if (!selectedAgent) return;
    const isRunning = selectedAgent.status === "running" || selectedAgent.status === "waiting";
    if (isRunning) {
      emitEvent("agent:stop", { agentId: selectedAgent.id });
    } else {
      emitEvent("agent:start", { agentId: selectedAgent.id });
    }
  }, [selectedAgent]);

  const handleStopAgent = useCallback(() => {
    if (!selectedAgent) return;
    emitEvent("agent:stop", { agentId: selectedAgent.id });
  }, [selectedAgent]);

  const handleDuplicateAgent = useCallback(async () => {
    if (!selectedAgent) return;
    const duplicate = await createAgent({
      name: `${selectedAgent.name} (copy)`,
      projectPath: selectedAgent.projectPath,
      model: selectedAgent.model,
      thinkingEnabled: selectedAgent.thinkingEnabled === 1,
      permissionMode: selectedAgent.permissionMode,
      claudeMd: selectedAgent.claudeMd ?? undefined,
      initialPrompt: selectedAgent.initialPrompt ?? undefined,
    });
    if (duplicate) {
      setSelectedAgentId(duplicate.id);
    }
  }, [selectedAgent, createAgent]);

  // Auto-select first agent if none selected and agents are loaded
  useEffect(() => {
    if (!selectedAgentId && agents.length > 0) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  return (
    <div className="flex h-screen bg-stone-950">
      <AgentSidebar
        agents={agents}
        selectedAgentId={selectedAgentId}
        onSelectAgent={handleSelectAgent}
        onCreateAgent={() => setDialogOpen(true)}
      />

      {/* Main terminal area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          </div>
        ) : selectedAgent ? (
          <>
            <TerminalInfoBar
              agent={selectedAgent}
              contextUsage={contextUsage}
              onToggleAgent={handleToggleAgent}
              onDuplicateAgent={handleDuplicateAgent}
              onStopAgent={handleStopAgent}
            />
            <TerminalView agentId={selectedAgent.id} />
            <TerminalStatusBar cliVersion={cliVersion} />
          </>
        ) : (
          <EmptyState />
        )}
      </div>

      <CreateAgentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}

/** Shown when no agent is selected */
function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-6">
      <div className="rounded-xl border border-white/5 bg-stone-900/80 p-4">
        <Monitor className="h-8 w-8 text-stone-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-stone-400">
          Select an agent to begin
        </p>
        <p className="mt-1 text-xs text-stone-600">
          Choose an agent from the sidebar to open its terminal
        </p>
      </div>
    </div>
  );
}
