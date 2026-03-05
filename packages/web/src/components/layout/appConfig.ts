import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Bot,
  FolderKanban,
  Puzzle,
  MessageSquare,
  Folder,
  Settings,
} from "lucide-react";

export interface AppNavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  { to: "/app/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/app/agents", labelKey: "nav.agents", icon: Bot },
  { to: "/app/projects", labelKey: "nav.projects", icon: FolderKanban },
  { to: "/app/skills", labelKey: "nav.skillsPlugins", icon: Puzzle },
  { to: "/app/chat", labelKey: "nav.chat", icon: MessageSquare },
  { to: "/app/files", labelKey: "nav.files", icon: Folder },
  { to: "/app/settings", labelKey: "nav.settings", icon: Settings },
];

export const ROUTE_TITLE_KEYS: Record<string, string> = {
  "/app/dashboard": "routes.generalOverview",
  "/app/agents": "routes.agents",
  "/app/projects": "routes.projects",
  "/app/skills": "routes.skillsPlugins",
  "/app/chat": "routes.chat",
  "/app/files": "routes.files",
  "/app/settings": "routes.settings",
};
