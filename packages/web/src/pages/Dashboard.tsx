import { useCallback, useEffect, useRef, useState } from "react";
import { Monitor, Loader2 } from "lucide-react";
import { useAgentsStore, type Agent } from "../stores/agents";
import { onEvent, emitEvent } from "../stores/socket";
import { AgentSidebar } from "../components/sidebar/AgentSidebar";
import { TerminalView } from "../components/terminal/TerminalView";
import { TerminalInfoBar } from "../components/terminal/TerminalInfoBar";
import { TerminalStatusBar } from "../components/terminal/TerminalStatusBar";
import { AgentFormDialog } from "../components/agents/AgentFormDialog";

const CONTEXT_RE = /context:\s*([\d.]+k?)\s*\/\s*([\d.]+k?)/i;

export function Dashboard() {
  const agents = useAgentsStore((s) => s.agents);
  const loading = useAgentsStore((s) => s.loading);
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);
  const connectSocket = useAgentsStore((s) => s.connectSocket);
  const disconnectSocket = useAgentsStore((s) => s.disconnectSocket);
  const createAgent = useAgentsStore((s) => s.createAgent);

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [secondAgentId, setSecondAgentId] = useState<string | null>(null);
  const [splitMode, setSplitMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [cliVersion, setCliVersion] = useState<string | null>(null);
  const [contextUsage, setContextUsage] = useState<string | null>(null);
  const [secondContextUsage, setSecondContextUsage] = useState<string | null>(null);

  const prevAgentRef = useRef<string | null>(null);

  useEffect(() => {
    fetchAgents();
    connectSocket();
    return () => disconnectSocket();
  }, [fetchAgents, connectSocket, disconnectSocket]);

  useEffect(() => {
    fetch("/api/system/version", { credentials: "include" })
      .then((r) => r.json())
      .then((data: { version: string }) => setCliVersion(data.version))
      .catch(() => setCliVersion("unknown"));
  }, []);

  useEffect(() => {
    if (!selectedAgentId) return;
    if (prevAgentRef.current !== selectedAgentId) {
      setContextUsage(null);
      prevAgentRef.current = selectedAgentId;
    }
    const unsub = onEvent("terminal:output", (data: unknown) => {
      const payload = data as { agentId: string; data: string };
      if (payload.agentId !== selectedAgentId) return;
      const match = CONTEXT_RE.exec(payload.data);
      if (match) setContextUsage(`${match[1]} / ${match[2]}`);
    });
    return unsub;
  }, [selectedAgentId]);

  useEffect(() => {
    if (!secondAgentId) return;
    setSecondContextUsage(null);
    const unsub = onEvent("terminal:output", (data: unknown) => {
      const payload = data as { agentId: string; data: string };
      if (payload.agentId !== secondAgentId) return;
      const match = CONTEXT_RE.exec(payload.data);
      if (match) setSecondContextUsage(`${match[1]} / ${match[2]}`);
    });
    return unsub;
  }, [secondAgentId]);

  const handleSelectAgent = useCallback((id: string) => {
    if (splitMode) {
      if (id === selectedAgentId) return;
      if (id === secondAgentId) {
        setSecondAgentId(selectedAgentId);
        setSelectedAgentId(id);
        return;
      }
      if (selectedAgentId && !secondAgentId) {
        setSecondAgentId(id);
      } else if (selectedAgentId && secondAgentId) {
        setSecondAgentId(id);
      } else {
        setSelectedAgentId(id);
      }
    } else {
      setSelectedAgentId(id);
    }
  }, [splitMode, selectedAgentId, secondAgentId]);

  const handleToggleSplit = useCallback(() => {
    setSplitMode((prev) => {
      if (prev) {
        setSecondAgentId(null);
        setSecondContextUsage(null);
      }
      return !prev;
    });
  }, []);

  useEffect(() => {
    if (!selectedAgentId && agents.length > 0) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? null;
  const secondAgent = agents.find((a) => a.id === secondAgentId) ?? null;

  const makeToggleHandler = useCallback((agent: typeof selectedAgent) => () => {
    if (!agent) return;
    const isRunning = agent.status === "running" || agent.status === "waiting";
    emitEvent(isRunning ? "agent:stop" : "agent:start", { agentId: agent.id });
  }, []);

  const makeStopHandler = useCallback((agent: typeof selectedAgent) => () => {
    if (!agent) return;
    emitEvent("agent:stop", { agentId: agent.id });
  }, []);

  const makeDuplicateHandler = useCallback((agent: typeof selectedAgent) => async () => {
    if (!agent) return;
    const duplicate = await createAgent({
      name: `${agent.name} (copy)`,
      projectPath: agent.projectPath,
      model: agent.model,
      thinkingEnabled: agent.thinkingEnabled === 1,
      permissionMode: agent.permissionMode,
      claudeMd: agent.claudeMd ?? undefined,
      initialPrompt: agent.initialPrompt ?? undefined,
    });
    if (duplicate) setSelectedAgentId(duplicate.id);
  }, [createAgent]);

  const makeEditHandler = useCallback((agent: typeof selectedAgent) => () => {
    if (agent) setEditAgent(agent);
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setEditAgent(null);
  }, []);

  return (
    <div className="flex h-screen bg-app-bg p-3 gap-3">
      <AgentSidebar
        agents={agents}
        selectedAgentId={selectedAgentId}
        secondAgentId={secondAgentId}
        splitMode={splitMode}
        onSelectAgent={handleSelectAgent}
        onCreateAgent={() => setDialogOpen(true)}
        onToggleSplit={handleToggleSplit}
      />

      <div className="flex min-w-0 flex-1 flex-col bg-neutral-bg2 border border-stroke rounded-2xl shadow-2 overflow-hidden">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : selectedAgent ? (
          <div className="flex flex-1 min-h-0">
            <div className="flex min-w-0 flex-1 flex-col min-h-0">
              <TerminalInfoBar
                agent={selectedAgent}
                contextUsage={contextUsage}
                onToggleAgent={makeToggleHandler(selectedAgent)}
                onEditAgent={makeEditHandler(selectedAgent)}
                onDuplicateAgent={makeDuplicateHandler(selectedAgent)}
                onStopAgent={makeStopHandler(selectedAgent)}
              />
              <TerminalView agentId={selectedAgent.id} />
              <TerminalStatusBar cliVersion={cliVersion} />
            </div>

            {splitMode && secondAgent && (
              <>
                <div className="w-px bg-stroke shrink-0" />
                <div className="flex min-w-0 flex-1 flex-col min-h-0">
                  <TerminalInfoBar
                    agent={secondAgent}
                    contextUsage={secondContextUsage}
                    onToggleAgent={makeToggleHandler(secondAgent)}
                    onEditAgent={makeEditHandler(secondAgent)}
                    onDuplicateAgent={makeDuplicateHandler(secondAgent)}
                    onStopAgent={makeStopHandler(secondAgent)}
                  />
                  <TerminalView agentId={secondAgent.id} />
                  <TerminalStatusBar cliVersion={cliVersion} />
                </div>
              </>
            )}

            {splitMode && !secondAgent && (
              <>
                <div className="w-px bg-stroke shrink-0" />
                <div className="flex min-w-0 flex-1 flex-col min-h-0 items-center justify-center">
                  <p className="text-[13px] text-neutral-fg-disabled">
                    Select a second agent
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      <AgentFormDialog
        open={dialogOpen || !!editAgent}
        onClose={handleDialogClose}
        agent={editAgent}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-6">
      <div className="rounded-xl border border-stroke bg-neutral-bg3 p-4">
        <Monitor className="h-8 w-8 text-neutral-fg-disabled" />
      </div>
      <div>
        <p className="text-sm font-medium text-neutral-fg2">
          Select an agent to begin
        </p>
        <p className="mt-1 text-xs text-neutral-fg3">
          Choose an agent from the sidebar to open its terminal
        </p>
      </div>
    </div>
  );
}
