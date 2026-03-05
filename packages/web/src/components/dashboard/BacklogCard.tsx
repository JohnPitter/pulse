import { useState } from "react";
import { Plus, CalendarClock, ChevronUp, ChevronDown } from "lucide-react";
import type { Task } from "../../stores/tasks";
import { CreateTaskDialog } from "../tasks/CreateTaskDialog";

interface Props {
  tasks: Task[];
}

export function BacklogCard({ tasks }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const backlogTasks = tasks.filter((t) => t.status === "backlog");
  const readyToRun = tasks.filter((t) => t.status === "scheduled").length;

  const nextDue = tasks
    .filter((t) => t.dueAt && t.status !== "completed" && t.status !== "failed")
    .sort((a, b) => (a.dueAt! < b.dueAt! ? -1 : 1))[0];

  const nextDueLabel = nextDue?.dueAt
    ? new Date(nextDue.dueAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "None";

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[13px] font-semibold text-text-primary">Backlog</span>
            <span className="ml-2 text-[11px] text-text-disabled">Tasks to schedule</span>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-surface-hover text-text-disabled">
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button type="button" className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-surface-hover text-text-disabled">
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Stat callouts — mimics floating labels on 3D visual */}
        <div className="flex-1 flex flex-col gap-3 relative">
          {/* Background placeholder visual */}
          <div className="flex-1 rounded-2xl bg-gradient-to-b from-[#E8E7E3] to-[#F2F1EE] flex items-center justify-center relative overflow-hidden min-h-[180px]">
            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: "linear-gradient(#D4D3D0 1px, transparent 1px), linear-gradient(90deg, #D4D3D0 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />

            {/* Center stat */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <span className="text-[42px] font-bold text-text-primary leading-none">{backlogTasks.length}</span>
              <span className="text-[11px] text-text-disabled tracking-wider uppercase">tasks in backlog</span>
            </div>

            {/* Floating callout — bottom left */}
            <div className="absolute bottom-4 left-4 bg-surface rounded-xl px-3 py-2 shadow-[var(--shadow-card)] border border-border">
              <p className="text-[10px] text-text-disabled">Next due</p>
              <p className="text-[13px] font-bold text-text-primary">{nextDueLabel}</p>
            </div>

            {/* Floating callout — top right */}
            <div className="absolute top-4 right-4 bg-surface rounded-xl px-3 py-2 shadow-[var(--shadow-card)] border border-border">
              <p className="text-[10px] text-text-disabled">Ready to run</p>
              <p className="text-[13px] font-bold text-orange">{readyToRun}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-surface border border-border py-2 text-[12px] font-medium text-text-primary hover:bg-surface-hover transition-all"
            >
              <Plus className="h-3.5 w-3.5 text-orange" />
              Add task
            </button>
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-surface border border-border py-2 text-[12px] font-medium text-text-primary hover:bg-surface-hover transition-all"
            >
              <CalendarClock className="h-3.5 w-3.5 text-blue" />
              Schedule
            </button>
          </div>
        </div>
      </div>

      <CreateTaskDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
