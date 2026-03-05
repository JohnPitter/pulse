import { Archive } from "lucide-react";

export function FilesPage() {
  return (
    <div className="flex h-full items-center justify-center flex-col gap-4">
      <Archive className="h-10 w-10 text-text-disabled" />
      <p className="text-[14px] font-semibold text-text-primary">Files</p>
      <p className="text-[13px] text-text-secondary">Repository for audio, documents and images.</p>
    </div>
  );
}
