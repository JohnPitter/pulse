import { useCallback, useEffect, useState } from "react";
import { Plus, Menu, BookOpen, Zap, Square } from "lucide-react";
import { useAgentsStore, type Agent } from "../../stores/agents";
import { useSessionStore } from "../../stores/session";
import { AgentSidebar } from "../../components/sidebar/AgentSidebar";
import { AgentCanvas } from "../../components/canvas/AgentCanvas";
import { ChatSidebar } from "../../components/chat/ChatSidebar";
import { ChatInput } from "../../components/chat/ChatInput";
import { SharedMemoryPanel } from "../../components/memory/SharedMemoryPanel";
import { SkillPicker } from "../../components/skills/SkillPicker";
import { AgentFormDialog } from "../../components/agents/AgentFormDialog";

export function ChatPage() {
  const agents = useAgentsStore((s) => s.agents);
  const loading = useAgentsStore((s) => s.loading);
  const fetchAgents = useAgentsStore((s) => s.fetchAgents);
  const connectSocket = useAgentsStore((s) => s.connectSocket);
  const disconnectSocket = useAgentsStore((s) => s.disconnectSocket);

  const connectSSE = useSessionStore((s) => s.connectSSE);
  const disconnectSSE = useSessionStore((s) => s.disconnectSSE);
  const sendMessage = useSessionStore((s) => s.sendMessage);
  const stopAgent = useSessionStore((s) => s.stopAgent);
  const loadMessages = useSessionStore((s) => s.loadMessages);
  const blocks = useSessionStore((s) => s.blocks);
  const streamingText = useSessionStore((s) => s.streamingText);
  const messages = useSessionStore((s) => s.messages);
  const isStreaming = useSessionStore((s) => s.isStreaming);

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [skillPickerOpen, setSkillPickerOpen] = useState(false);

  useEffect(() => {
    fetchAgents();
    connectSocket();
    return () => disconnectSocket();
  }, [fetchAgents, connectSocket, disconnectSocket]);

  useEffect(() => {
    if (!selectedAgentId && agents.length > 0) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  useEffect(() => {
    if (!selectedAgentId) return;
    connectSSE(selectedAgentId);
    loadMessages(selectedAgentId);
    return () => disconnectSSE(selectedAgentId);
  }, [selectedAgentId, connectSSE, disconnectSSE, loadMessages]);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? null;

  const handleSend = useCallback(async (content: string, imageBase64?: string) => {
    if (!selectedAgentId) return;
    await sendMessage(selectedAgentId, content, imageBase64);
  }, [selectedAgentId, sendMessage]);

  const handleStop = useCallback(async () => {
    if (!selectedAgentId) return;
    await stopAgent(selectedAgentId);
  }, [selectedAgentId, stopAgent]);

  const handleSelectAgent = useCallback((id: string) => {
    setSelectedAgentId(id);
    setSidebarOpen(false);
  }, []);

  const agentBlocks = selectedAgentId ? (blocks[selectedAgentId] ?? []) : [];
  const agentMessages = selectedAgentId ? (messages[selectedAgentId] ?? []) : [];
  const agentStreamingText = selectedAgentId ? (streamingText[selectedAgentId] ?? "") : "";
  const agentIsStreaming = selectedAgentId ? (isStreaming[selectedAgentId] ?? false) : false;

  const statusColor: Record<string, string> = {
    running: "bg-success",
    waiting: "bg-warning",
    idle: "bg-border-strong",
    error: "bg-danger",
  };

  return (
    <div className="flex h-full gap-3">
      {/* Mobile sidebar toggle */}
      <div className="flex items-center h-12 px-4 bg-surface border-b border-border shrink-0 md:hidden absolute top-0 left-0 right-0">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-muted"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-text-primary tracking-tight ml-3">Chat</span>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="ml-auto rounded-lg p-1.5 text-text-secondary hover:text-orange"
          aria-label="Create agent"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <AgentSidebar
        agents={agents}
        selectedAgentId={selectedAgentId}
        secondAgentId={null}
        splitMode={false}
        onSelectAgent={handleSelectAgent}
        onCreateAgent={() => { setDialogOpen(true); setSidebarOpen(false); }}
        onToggleSplit={() => {}}
        mobileOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col bg-surface border border-border rounded-2xl shadow-[var(--shadow-card)] overflow-hidden">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-orange animate-[pulse-dot_1.2s_ease-in-out_infinite]" />
              <span className="h-1.5 w-1.5 rounded-full bg-orange animate-[pulse-dot_1.2s_ease-in-out_infinite_0.2s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-orange animate-[pulse-dot_1.2s_ease-in-out_infinite_0.4s]" />
            </div>
          </div>
        ) : selectedAgent ? (
          <>
            {/* Topbar */}
            <div className="flex items-center gap-3 px-4 h-[52px] border-b border-border shrink-0 bg-surface">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`h-2 w-2 rounded-full shrink-0 ${statusColor[selectedAgent.status ?? "idle"] ?? "bg-border-strong"}`} />
                <span className="text-[14px] font-semibold text-text-primary truncate">{selectedAgent.name}</span>
                <span className="hidden sm:block text-[11px] text-text-disabled bg-surface-muted border border-border px-2 py-0.5 rounded-md capitalize">
                  {selectedAgent.status ?? "idle"}
                </span>
              </div>

              <div className="ml-auto flex items-center gap-1.5">
                {agentIsStreaming && (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-danger hover:bg-danger-light transition-colors border border-danger/20"
                  >
                    <Square className="h-3 w-3" />
                    Stop
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSkillPickerOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] text-text-secondary hover:bg-surface-muted transition-colors border border-border"
                >
                  <Zap className="h-3.5 w-3.5 text-orange" />
                  Skills
                </button>
                <button
                  type="button"
                  onClick={() => setMemoryOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] text-text-secondary hover:bg-surface-muted transition-colors border border-border"
                >
                  <BookOpen className="h-3.5 w-3.5 text-blue" />
                  Memory
                </button>
              </div>
            </div>

            {/* Canvas + Chat layout */}
            <div className="flex flex-1 min-h-0">
              <div className="flex flex-col flex-1 min-w-0 min-h-0 bg-surface-muted/40">
                <AgentCanvas blocks={agentBlocks} isStreaming={agentIsStreaming} />
              </div>
              <div className="flex flex-col w-[340px] shrink-0 border-l border-border min-h-0">
                <ChatSidebar messages={agentMessages} streamingContent={agentStreamingText} />
                <ChatInput onSend={handleSend} disabled={agentIsStreaming} />
              </div>
            </div>
          </>
        ) : agents.length === 0 ? (
          <NoAgentsState onCreateAgent={() => setDialogOpen(true)} />
        ) : (
          <SelectAgentState />
        )}
      </div>

      <SharedMemoryPanel open={memoryOpen} onClose={() => setMemoryOpen(false)} />
      {selectedAgentId && (
        <SkillPicker
          agentId={selectedAgentId}
          open={skillPickerOpen}
          onClose={() => setSkillPickerOpen(false)}
        />
      )}
      <AgentFormDialog
        open={dialogOpen || !!editAgent}
        onClose={() => { setDialogOpen(false); setEditAgent(null); }}
        agent={editAgent}
      />
    </div>
  );
}

function NoAgentsState({ onCreateAgent }: { onCreateAgent: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="panel p-10 flex flex-col items-center gap-5 max-w-sm w-full">
        <div className="h-14 w-14 rounded-xl border border-border bg-surface-muted flex items-center justify-center">
          <Zap className="h-6 w-6 text-orange" />
        </div>
        <div className="text-center space-y-1.5">
          <h2 className="text-[18px] font-bold text-text-primary tracking-tight">No agents yet</h2>
          <p className="text-[13px] text-text-secondary leading-relaxed max-w-[220px]">
            Create your first agent to get started.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateAgent}
          className="btn btn-primary flex items-center gap-2 px-5 py-2.5"
        >
          <Plus className="h-4 w-4" />
          Create Agent
        </button>
      </div>
    </div>
  );
}

function SelectAgentState() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-[13px] text-text-disabled">Select an agent from the sidebar</p>
    </div>
  );
}
