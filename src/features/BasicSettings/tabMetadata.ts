import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  DatabaseBackup,
  FlaskConical,
  Gift,
  Layers,
  LineChart,
  RefreshCcw,
  Route,
  ShieldCheck,
  SlidersHorizontal,
  TerminalSquare,
  UserRound,
} from "lucide-react"

export type SettingsTabId =
  | "general"
  | "balanceHistory"
  | "accountManagement"
  | "refresh"
  | "checkinRedeem"
  | "webAiApiCheck"
  | "accountUsage"
  | "dataBackup"
  | "managedSite"
  | "cliProxy"
  | "claudeCodeRouter"
  | "permissions"

export interface SettingsTabMeta {
  id: SettingsTabId
  icon: LucideIcon
  requiresOptionalPermissions?: boolean
}

export const SETTINGS_TAB_METADATA: SettingsTabMeta[] = [
  {
    id: "general",
    icon: SlidersHorizontal,
  },
  {
    id: "accountManagement",
    icon: UserRound,
  },
  {
    id: "refresh",
    icon: RefreshCcw,
  },
  {
    id: "checkinRedeem",
    icon: Gift,
  },
  {
    id: "balanceHistory",
    icon: LineChart,
  },
  {
    id: "accountUsage",
    icon: BarChart3,
  },
  {
    id: "webAiApiCheck",
    icon: FlaskConical,
  },
  {
    id: "managedSite",
    icon: Layers,
  },
  {
    id: "cliProxy",
    icon: TerminalSquare,
  },
  {
    id: "claudeCodeRouter",
    icon: Route,
  },
  {
    id: "permissions",
    icon: ShieldCheck,
    requiresOptionalPermissions: true,
  },
  {
    id: "dataBackup",
    icon: DatabaseBackup,
  },
]
