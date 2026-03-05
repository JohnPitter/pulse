import { Puzzle } from "lucide-react";

export function SkillsPage() {
  return (
    <div className="flex h-full items-center justify-center flex-col gap-4">
      <Puzzle className="h-10 w-10 text-text-disabled" />
      <p className="text-[14px] font-semibold text-text-primary">Skills & Plugins</p>
      <p className="text-[13px] text-text-secondary">Coming soon — manage agent skills and installed plugins.</p>
    </div>
  );
}
