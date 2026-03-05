import { FormEvent, useEffect, useMemo, useState } from "react";
import { Download, Plug2, Sparkles, X } from "lucide-react";
import { useSkillsStore, type Skill } from "../../stores/skills";
import { useShellQuery } from "./useShellQuery";
import { useI18n } from "../../i18n";

const CARD_CLASS =
  "rounded-[20px] border border-black/6 bg-[#F1EFEC] shadow-[0_8px_18px_rgba(0,0,0,0.06)]";

const TYPE_STYLE: Record<string, string> = {
  tool: "bg-warning-light text-warning",
  prompt: "bg-info-light text-info",
  mcp: "bg-success-light text-success",
};

const TYPE_KEY: Record<string, string> = {
  tool: "skillsPage.typeTool",
  prompt: "skillsPage.typePrompt",
  mcp: "skillsPage.typeMcp",
};

export function SkillsPage() {
  const query = useShellQuery();
  const [modalOpen, setModalOpen] = useState(false);
  const [skillName, setSkillName] = useState("");
  const [skillType, setSkillType] = useState("tool");
  const [installing, setInstalling] = useState(false);
  const { t } = useI18n();

  const skills = useSkillsStore((s) => s.skills);
  const fetchSkills = useSkillsStore((s) => s.fetchSkills);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const filteredSkills = useMemo(
    () =>
      skills.filter((skill) => {
        const haystack = `${skill.name} ${skill.description}`.toLowerCase();
        return !query || haystack.includes(query);
      }),
    [skills, query],
  );

  const handleInstall = async (event: FormEvent) => {
    event.preventDefault();
    if (!skillName.trim()) return;
    setInstalling(true);
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: skillName.trim(), type: skillType, description: "" }),
      });
      if (res.ok) {
        await fetchSkills();
        setSkillName("");
        setModalOpen(false);
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <>
      <div className="grid h-full min-h-[520px] grid-cols-1 gap-3 animate-fade-in">
        <section className={`${CARD_CLASS} min-h-0 p-4 animate-fade-up stagger-1`}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-neutral-fg1">{t("skillsPage.skillsAndPlugins")}</h2>
              <p className="text-[12px] text-neutral-fg2">{t("skillsPage.skillsCatalog")}</p>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-xl border border-stroke bg-neutral-bg2 px-3 py-1.5 text-[12px] font-medium text-neutral-fg1 hover:bg-neutral-bg3"
            >
              <Download className="h-3.5 w-3.5 text-brand" />
              {t("skillsPage.install")}
            </button>
          </div>

          {filteredSkills.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {filteredSkills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} t={t} />
              ))}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-stroke bg-neutral-bg2/70">
              <p className="text-[12px] text-neutral-fg3">{t("skillsPage.noSkills")}</p>
            </div>
          )}
        </section>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
          <form
            onSubmit={handleInstall}
            className="w-full max-w-md rounded-2xl border border-stroke bg-neutral-bg2 p-5 shadow-16 animate-fade-up"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[16px] font-semibold text-neutral-fg1">{t("skillsPage.installPlugin")}</p>
                <p className="text-[12px] text-neutral-fg2">{t("skillsPage.installModalSubtitle")}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-neutral-fg3 hover:bg-neutral-bg3"
                aria-label={t("skillsPage.closeInstallModal")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mb-2 block text-[12px] font-medium text-neutral-fg2">
              {t("skillsPage.pluginName")}
              <input
                type="text"
                value={skillName}
                onChange={(event) => setSkillName(event.target.value)}
                placeholder="ex: S3 Exporter"
                className="mt-1 w-full rounded-xl border border-stroke bg-neutral-bg3 px-3 py-2 text-[13px] text-neutral-fg1 focus:outline-none focus:ring-2 focus:ring-brand-light"
              />
            </label>

            <label className="mb-3 block text-[12px] font-medium text-neutral-fg2">
              {t("skillsPage.source")}
              <select
                value={skillType}
                onChange={(event) => setSkillType(event.target.value)}
                className="mt-1 w-full rounded-xl border border-stroke bg-neutral-bg3 px-3 py-2 text-[13px] text-neutral-fg1 focus:outline-none focus:ring-2 focus:ring-brand-light"
              >
                <option value="tool">{t("skillsPage.typeTool")}</option>
                <option value="prompt">{t("skillsPage.typePrompt")}</option>
                <option value="mcp">{t("skillsPage.typeMcp")}</option>
              </select>
            </label>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2 text-[13px] font-semibold text-white hover:bg-brand-hover"
            >
              {installing ? (
                <>
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  {t("skillsPage.installing")}
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  {t("skillsPage.installPluginButton")}
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function SkillCard({ skill, t }: { skill: Skill; t: (key: string) => string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-[#ECE9E4] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-neutral-fg1">{skill.name}</p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${TYPE_STYLE[skill.type] ?? "bg-neutral-bg3 text-neutral-fg2"}`}>
          {t(TYPE_KEY[skill.type] ?? skill.type)}
        </span>
      </div>
      <p className="text-[11px] text-neutral-fg2">{skill.description || "—"}</p>
      {skill.enabledByDefault && (
        <span className="mt-1 inline-block rounded-full bg-success-light px-2 py-0.5 text-[9px] font-semibold text-success">
          {t("skillsPage.enabledByDefault")}
        </span>
      )}
    </div>
  );
}
