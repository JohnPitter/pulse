import { useMemo, useState } from "react";
import { FileText, Filter, Headphones, Image, Layers3, Table2 } from "lucide-react";
import { FILES, PROJECTS, type FileRecord } from "./mockData";
import { useShellQuery } from "./useShellQuery";

const CARD_CLASS =
  "rounded-[20px] border border-black/6 bg-[#F1EFEC] shadow-[0_8px_18px_rgba(0,0,0,0.06)]";

const KINDS: Array<FileRecord["kind"] | "all"> = ["all", "image", "document", "audio", "dataset"];

const ICONS = {
  image: Image,
  document: FileText,
  audio: Headphones,
  dataset: Table2,
} as const;

export function FilesPage() {
  const query = useShellQuery();
  const [kind, setKind] = useState<FileRecord["kind"] | "all">("all");
  const [selectedFileId, setSelectedFileId] = useState(FILES[0]?.id ?? "");

  const filteredFiles = useMemo(
    () =>
      FILES.filter((file) => {
        const matchesKind = kind === "all" || file.kind === kind;
        const content = `${file.name} ${file.kind}`.toLowerCase();
        return matchesKind && (!query || content.includes(query));
      }),
    [kind, query],
  );

  const selectedFile =
    filteredFiles.find((file) => file.id === selectedFileId) ?? filteredFiles[0] ?? null;
  const selectedProject = PROJECTS.find((project) => project.id === selectedFile?.project_id) ?? null;

  return (
    <div className="grid h-full min-h-[520px] grid-cols-1 gap-3 xl:grid-cols-[0.66fr_0.34fr]">
      <section className={`${CARD_CLASS} min-h-0 p-4`}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-neutral-fg1">Files</h2>
            <p className="text-[12px] text-neutral-fg2">file_grid + file_filters</p>
          </div>
          <Filter className="h-4 w-4 text-neutral-fg3" />
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {KINDS.map((candidate) => (
            <button
              key={candidate}
              type="button"
              onClick={() => setKind(candidate)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${
                kind === candidate
                  ? "bg-neutral-fg1 text-white"
                  : "border border-stroke bg-neutral-bg2 text-neutral-fg2 hover:bg-neutral-bg3"
              }`}
            >
              {candidate}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {filteredFiles.map((file) => {
            const Icon = ICONS[file.kind];
            return (
              <button
                key={file.id}
                type="button"
                onClick={() => setSelectedFileId(file.id)}
                className={`rounded-2xl border p-3 text-left transition-colors ${
                  file.id === selectedFile?.id
                    ? "border-brand/40 bg-neutral-bg2"
                    : "border-black/5 bg-[#ECE9E4] hover:border-stroke"
                }`}
              >
                <div className="mb-3 flex h-[72px] items-center justify-center rounded-xl border border-black/5 bg-[linear-gradient(180deg,#EEEAE5,#E2DFD9)]">
                  <Icon className="h-7 w-7 text-neutral-fg3" />
                </div>
                <p className="truncate text-[12px] font-semibold text-neutral-fg1">{file.name}</p>
                <p className="mt-1 text-[10px] text-neutral-fg3">
                  {file.size} · {file.kind}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className={`${CARD_CLASS} flex min-h-0 flex-col p-4`}>
        <div className="mb-3 flex items-center gap-2">
          <Layers3 className="h-4 w-4 text-neutral-fg3" />
          <div>
            <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-neutral-fg1">Preview panel</h3>
            <p className="text-[12px] text-neutral-fg2">preview_panel</p>
          </div>
        </div>

        {selectedFile ? (
          <div className="flex h-full flex-col">
            <div className="mb-3 flex h-[190px] items-center justify-center rounded-2xl border border-black/5 bg-[linear-gradient(180deg,#EEEAE5,#E2DFD9)]">
              <div className="relative h-[98px] w-[98px] rounded-[24px] border border-black/10 bg-[#CFCCC7]">
                <div className="absolute left-1/2 top-1/2 h-[56px] w-[56px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-black/10 bg-brand/75" />
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-black/5 bg-[#ECE9E4] p-3">
              <InfoRow label="File" value={selectedFile.name} />
              <InfoRow label="Type" value={selectedFile.kind} />
              <InfoRow label="Size" value={selectedFile.size} />
              <InfoRow label="Project" value={selectedProject?.name ?? "Unlinked"} />
            </div>

            <button
              type="button"
              className="mt-auto rounded-xl border border-stroke bg-neutral-bg2 py-2 text-[12px] font-medium text-neutral-fg1 hover:bg-neutral-bg3"
            >
              Open file
            </button>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-stroke bg-neutral-bg2/70">
            <p className="text-[12px] text-neutral-fg3">No file matches current filters.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-neutral-fg3">{label}</p>
      <p className="truncate text-[12px] font-semibold text-neutral-fg1">{value}</p>
    </div>
  );
}
