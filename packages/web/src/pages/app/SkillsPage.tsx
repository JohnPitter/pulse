import { FormEvent, useMemo, useState } from "react";
import { Download, Plug2, Sparkles, X } from "lucide-react";
import { PLUGINS, SKILLS_CATALOG } from "./mockData";
import { useShellQuery } from "./useShellQuery";

const CARD_CLASS =
  "rounded-[20px] border border-black/6 bg-[#F1EFEC] shadow-[0_8px_18px_rgba(0,0,0,0.06)]";

const CATEGORY_STYLE: Record<string, string> = {
  automation: "bg-warning-light text-warning",
  analysis: "bg-info-light text-info",
  connector: "bg-success-light text-success",
};

export function SkillsPage() {
  const query = useShellQuery();
  const [modalOpen, setModalOpen] = useState(false);
  const [pluginName, setPluginName] = useState("");
  const [source, setSource] = useState("marketplace");
  const [installing, setInstalling] = useState(false);

  const filteredSkills = useMemo(
    () =>
      SKILLS_CATALOG.filter((skill) => {
        const haystack = `${skill.name} ${skill.description}`.toLowerCase();
        return !query || haystack.includes(query);
      }),
    [query],
  );

  const filteredPlugins = useMemo(
    () =>
      PLUGINS.filter((plugin) => {
        const haystack = `${plugin.name} ${plugin.version}`.toLowerCase();
        return !query || haystack.includes(query);
      }),
    [query],
  );

  const handleInstall = (event: FormEvent) => {
    event.preventDefault();
    if (!pluginName.trim()) return;
    setInstalling(true);
    setTimeout(() => {
      setInstalling(false);
      setPluginName("");
      setModalOpen(false);
    }, 900);
  };

  return (
    <>
      <div className="grid h-full min-h-[520px] grid-cols-1 gap-3 xl:grid-cols-[0.62fr_0.38fr]">
        <section className={`${CARD_CLASS} min-h-0 p-4`}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-neutral-fg1">Skills & plugins</h2>
              <p className="text-[12px] text-neutral-fg2">skills_catalog</p>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-xl border border-stroke bg-neutral-bg2 px-3 py-1.5 text-[12px] font-medium text-neutral-fg1 hover:bg-neutral-bg3"
            >
              <Download className="h-3.5 w-3.5 text-brand" />
              Install
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {filteredSkills.map((skill) => (
              <div key={skill.id} className="rounded-2xl border border-black/5 bg-[#ECE9E4] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-neutral-fg1">{skill.name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${CATEGORY_STYLE[skill.category]}`}>
                    {skill.category}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-fg2">{skill.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={`${CARD_CLASS} min-h-0 p-4`}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-neutral-fg1">Plugin cards</h3>
              <p className="text-[12px] text-neutral-fg2">plugin_cards</p>
            </div>
            <Plug2 className="h-4 w-4 text-neutral-fg3" />
          </div>

          <div className="space-y-2">
            {filteredPlugins.map((plugin) => (
              <div key={plugin.id} className="rounded-2xl border border-black/5 bg-[#ECE9E4] p-3">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-neutral-fg1">{plugin.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      plugin.status === "installed"
                        ? "bg-success-light text-success"
                        : "bg-neutral-bg3 text-neutral-fg2"
                    }`}
                  >
                    {plugin.status}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-fg2">Version {plugin.version}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
          <form
            onSubmit={handleInstall}
            className="w-full max-w-md rounded-2xl border border-stroke bg-neutral-bg2 p-5 shadow-16"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[16px] font-semibold text-neutral-fg1">Install plugin</p>
                <p className="text-[12px] text-neutral-fg2">install_modal</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-neutral-fg3 hover:bg-neutral-bg3"
                aria-label="Close install modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mb-2 block text-[12px] font-medium text-neutral-fg2">
              Plugin name
              <input
                type="text"
                value={pluginName}
                onChange={(event) => setPluginName(event.target.value)}
                placeholder="ex: S3 Exporter"
                className="mt-1 w-full rounded-xl border border-stroke bg-neutral-bg3 px-3 py-2 text-[13px] text-neutral-fg1 focus:outline-none focus:ring-2 focus:ring-brand-light"
              />
            </label>

            <label className="mb-3 block text-[12px] font-medium text-neutral-fg2">
              Source
              <select
                value={source}
                onChange={(event) => setSource(event.target.value)}
                className="mt-1 w-full rounded-xl border border-stroke bg-neutral-bg3 px-3 py-2 text-[13px] text-neutral-fg1 focus:outline-none focus:ring-2 focus:ring-brand-light"
              >
                <option value="marketplace">Marketplace</option>
                <option value="github">GitHub</option>
                <option value="local">Local package</option>
              </select>
            </label>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2 text-[13px] font-semibold text-white hover:bg-brand-hover"
            >
              {installing ? (
                <>
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  Install plugin
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
