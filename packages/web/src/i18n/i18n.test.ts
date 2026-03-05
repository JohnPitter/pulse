import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";

const KNOWN_PLACEHOLDERS = [
  "agents_table_or_cards",
  "agent_detail_drawer",
  "project_list",
  "project_overview",
  "tabela_ou_cards_de_agentes",
  "painel_de_detalhes_do_agente",
  "lista_de_projetos",
  "visão_geral_do_projeto",
  "skills_catalog",
  "catálogo_de_skills",
  "plugin_cards",
  "cards_de_plugin",
  "install_modal",
  "modal_de_instalação",
  "thread_list",
  "lista_de_threads",
  "chat_panel",
  "painel_de_chat",
  "agent_selector",
  "seletor_de_agente",
  "file_grid + file_filters",
  "grade_de_arquivos + filtros",
  "preview_panel",
  "painel_de_preview",
  "tasks_board",
  "quadro_de_tasks",
];

describe("i18n translations", () => {
  const source = readFileSync("src/i18n/index.tsx", "utf-8");

  it("EN translations should not contain placeholder underscore-style values", () => {
    const enStart = source.indexOf("const EN_TRANSLATIONS");
    const enEnd = source.indexOf("const PT_BR_TRANSLATIONS");
    const enBlock = source.slice(enStart, enEnd);

    for (const placeholder of KNOWN_PLACEHOLDERS) {
      expect(enBlock, `EN contains placeholder "${placeholder}"`).not.toContain(`"${placeholder}"`);
    }
  });

  it("PT-BR translations should not contain placeholder underscore-style values", () => {
    const ptStart = source.indexOf("const PT_BR_TRANSLATIONS");
    const ptEnd = source.indexOf("const DICTIONARIES");
    const ptBlock = source.slice(ptStart, ptEnd);

    for (const placeholder of KNOWN_PLACEHOLDERS) {
      expect(ptBlock, `PT-BR contains placeholder "${placeholder}"`).not.toContain(`"${placeholder}"`);
    }
  });
});
