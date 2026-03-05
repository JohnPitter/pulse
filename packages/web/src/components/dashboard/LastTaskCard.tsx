import { ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import type { LastExecution } from "../../stores/dashboard";

interface Props {
  execution: LastExecution | null;
}

export function LastTaskCard({ execution }: Props) {
  if (!execution) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16px] font-bold text-text-primary">Last task</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[12px] text-text-disabled">No executions yet</p>
        </div>
      </div>
    );
  }

  const isSuccess = execution.result === "success";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[16px] font-bold text-text-primary">Last task</h3>
        <span className="text-[11px] font-medium text-text-secondary border border-border rounded-lg px-2 py-0.5">
          {execution.logsCount} logs
        </span>
      </div>

      {/* Metric fields */}
      <div className="space-y-3 flex-1">
        <div>
          <p className="text-[10px] text-text-disabled uppercase tracking-wider font-semibold">Task</p>
          <p className="text-[15px] font-bold text-text-primary leading-tight mt-0.5 line-clamp-2">
            {execution.task?.title ?? execution.taskId.slice(0, 8)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-text-disabled uppercase tracking-wider font-semibold">Agent</p>
          <p className="text-[14px] font-semibold text-text-secondary">{execution.agentId.slice(0, 12)}…</p>
        </div>
        <div>
          <p className="text-[10px] text-text-disabled uppercase tracking-wider font-semibold">Result</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isSuccess
              ? <CheckCircle2 className="h-4 w-4 text-success" />
              : <XCircle className="h-4 w-4 text-danger" />}
            <span className={`text-[14px] font-bold ${isSuccess ? "text-success" : "text-danger"}`}>
              {execution.result ?? "unknown"}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom visual area + action */}
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          {execution.summary && (
            <p className="text-[11px] text-text-disabled line-clamp-1 flex-1 mr-3">{execution.summary}</p>
          )}
          <button
            type="button"
            className="flex items-center gap-1.5 text-[11px] font-medium text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open logs
          </button>
        </div>
      </div>
    </div>
  );
}
