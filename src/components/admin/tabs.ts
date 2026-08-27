import {
  FileText,
  FolderKanban,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutList,
  Package,
  Download,
  Users,
  ShieldCheck,
  Type,
} from "lucide-react";

export const ADMIN_TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard, group: "Site" },
  { key: "landing", label: "Landing page", icon: Type, group: "Site" },
  { key: "sections", label: "Section order", icon: LayoutList, group: "Site" },
  { key: "packs", label: "Packs", icon: Package, group: "Content" },
  { key: "prompts", label: "Prompts", icon: FileText, group: "Content" },
  { key: "skills", label: "Skills", icon: Download, group: "Content" },
  { key: "waitlist", label: "Waitlist", icon: Users, group: "Content" },
  { key: "categories", label: "Categories", icon: FolderKanban, group: "Content" },
  { key: "logos", label: "AI Models", icon: ImageIcon, group: "Content" },
  { key: "whitelist", label: "Admins", icon: ShieldCheck, group: "Access" },
] as const;

export type AdminTab = (typeof ADMIN_TABS)[number]["key"];

export const ADMIN_TAB_KEYS = ADMIN_TABS.map((t) => t.key) as readonly AdminTab[];

export function isAdminTab(value: unknown): value is AdminTab {
  return typeof value === "string" && (ADMIN_TAB_KEYS as readonly string[]).includes(value);
}

export const ADMIN_TAB_GROUPS = ["Site", "Content", "Access"] as const;
