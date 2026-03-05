import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Bot,
  FolderKanban,
  Puzzle,
  MessageSquare,
  Folder,
} from "lucide-react";

export interface AppNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/agents", label: "Agents", icon: Bot },
  { to: "/app/projects", label: "Projects", icon: FolderKanban },
  { to: "/app/skills", label: "Skills & Plugins", icon: Puzzle },
  { to: "/app/chat", label: "Chat", icon: MessageSquare },
  { to: "/app/files", label: "Files", icon: Folder },
];

export const ROUTE_TITLES: Record<string, string> = {
  "/app/dashboard": "General overview",
  "/app/agents": "Agents",
  "/app/projects": "Projects",
  "/app/skills": "Skills & plugins",
  "/app/chat": "Chat",
  "/app/files": "Files",
};
