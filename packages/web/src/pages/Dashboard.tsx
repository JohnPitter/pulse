import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Menu, BookOpen, Zap, Square } from "lucide-react";
import { useAgentsStore, type Agent } from "../stores/agents";
import { useSessionStore } from "../stores/session";
import { AgentSidebar } from "../components/sidebar/AgentSidebar";
import { AgentCanvas } from "../components/canvas/AgentCanvas";
import { ChatSidebar } from "../components/chat/ChatSidebar";
import { ChatInput } from "../components/chat/ChatInput";
import { SharedMemoryPanel } from "../components/memory/SharedMemoryPanel";
import { SkillPicker } from "../components/skills/SkillPicker";
import { AgentFormDialog } from "../components/agents/AgentFormDialog";

export function Dashboard() {
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

  // Auto-select first agent
  useEffect(() => {
    if (!selectedAgentId && agents.length > 0) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  // Connect SSE + load messages when agent changes
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

  return (
    <div className="flex h-screen flex-col bg-app-bg md:flex-row md:p-3 md:gap-3">
      {/* Mobile header */}
      <div className="flex items-center h-12 px-4 bg-white border-b border-stroke shrink-0 md:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-1.5 text-neutral-fg2 hover:text-neutral-fg1"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-neutral-fg1 tracking-tight ml-3">Pulse</span>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="ml-auto rounded-lg p-1.5 text-neutral-fg2 hover:text-brand"
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
      <div className="flex min-w-0 flex-1 flex-col bg-white md:border md:border-stroke md:rounded-2xl md:shadow-2 overflow-hidden">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          </div>
        ) : selectedAgent ? (
          <>
            {/* Topbar */}
            <div className="flex items-center gap-3 px-5 h-[52px] border-b border-stroke shrink-0 bg-white">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[14px] font-semibold text-neutral-fg1 truncate">{selectedAgent.name}</span>
                <span className="text-[11px] text-neutral-fg3 bg-neutral-bg3 px-2 py-0.5 rounded-full capitalize">
                  {selectedAgent.status ?? "idle"}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                {agentIsStreaming && (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] text-red-600 hover:bg-red-50 transition-colors border border-red-200"
                  >
                    <Square className="h-3 w-3" />
                    Stop
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSkillPickerOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] text-neutral-fg2 hover:bg-neutral-bg3 transition-colors border border-stroke"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  Skills
                </button>
                <button
                  type="button"
                  onClick={() => setMemoryOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] text-neutral-fg2 hover:bg-neutral-bg3 transition-colors border border-stroke"
                >
                  <BookOpen className="h-3.5 w-3.5 text-amber-500" />
                  Memory
                </button>
              </div>
            </div>

            {/* Canvas + Chat layout */}
            <div className="flex flex-1 min-h-0">
              {/* Canvas */}
              <div className="flex flex-col flex-1 min-w-0 min-h-0 bg-neutral-bg3/30">
                <AgentCanvas blocks={agentBlocks} isStreaming={agentIsStreaming} />
              </div>

              {/* Chat sidebar */}
              <div className="flex flex-col w-[360px] shrink-0 border-l border-stroke min-h-0">
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

      {/* Modals */}
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
      <div className="bg-white border border-stroke rounded-2xl p-10 flex flex-col items-center gap-6 max-w-md w-full shadow-4">
        <div className="rounded-2xl bg-amber-50 p-5">
          <Zap className="h-10 w-10 text-amber-500" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-[22px] font-bold text-neutral-fg1 tracking-tight">No agents yet</h2>
          <p className="text-[14px] text-neutral-fg2 leading-relaxed max-w-xs">
            Create your first agent to get started.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateAgent}
          className="btn-primary flex items-center gap-2 px-6 py-2.5 text-[14px]"
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
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <p className="text-[13px] text-neutral-fg3">Select an agent from the sidebar</p>
    </div>
  );
}
