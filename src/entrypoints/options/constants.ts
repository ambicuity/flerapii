import {
  ArrowLeftRight,
  BarChart3,
  Bookmark,
  CalendarCheck2,
  Cpu,
  Info,
  KeyRound,
  Layers,
  LineChart,
  Palette,
  RefreshCcw,
  Settings,
  UserRound,
  UserRoundKey,
} from "lucide-react"
import { createElement, lazy, Suspense, type ComponentType } from "react"

import { DEV_MENU_ITEM_IDS } from "~/constants/devOptionsMenuIds"
import { MENU_ITEM_IDS } from "~/constants/optionsMenuIds"

import About from "./pages/About"
import AccountManagement from "./pages/AccountManagement"
import ApiCredentialProfiles from "./pages/ApiCredentialProfiles"
import AutoCheckin from "./pages/AutoCheckin"
import BalanceHistory from "./pages/BalanceHistory"
import BasicSettings from "./pages/BasicSettings"
import BookmarkManagement from "./pages/BookmarkManagement"
import ImportExport from "./pages/ImportExport"
import KeyManagement from "./pages/KeyManagement"
import managedSiteChannels from "./pages/ManagedSiteChannels"
import ManagedSiteModelSync from "./pages/ManagedSiteModelSync"
import ModelList from "./pages/ModelList"
import UsageAnalytics from "./pages/UsageAnalytics"

//
export interface MenuItem {
  id: string
  name: string
  icon: ComponentType<{ className?: string }>
  component: ComponentType<any>
}

//
const BASE_MENU_ITEMS: MenuItem[] = [
  {
    id: MENU_ITEM_IDS.BASIC,
    name: "",
    icon: Settings,
    component: BasicSettings,
  },
  {
    id: MENU_ITEM_IDS.ACCOUNT,
    name: "",
    icon: UserRound,
    component: AccountManagement,
  },
  {
    id: MENU_ITEM_IDS.BOOKMARK,
    name: "",
    icon: Bookmark,
    component: BookmarkManagement,
  },
  {
    id: MENU_ITEM_IDS.AUTO_CHECKIN,
    name: "",
    icon: CalendarCheck2,
    component: AutoCheckin,
  },
  {
    id: MENU_ITEM_IDS.MODELS,
    name: "",
    icon: Cpu,
    component: ModelList,
  },
  {
    id: MENU_ITEM_IDS.KEYS,
    name: "",
    icon: UserRoundKey,
    component: KeyManagement,
  },
  {
    id: MENU_ITEM_IDS.API_CREDENTIAL_PROFILES,
    name: "API ",
    icon: KeyRound,
    component: ApiCredentialProfiles,
  },
  {
    id: MENU_ITEM_IDS.BALANCE_HISTORY,
    name: "",
    icon: LineChart,
    component: BalanceHistory,
  },
  {
    id: MENU_ITEM_IDS.USAGE_ANALYTICS,
    name: "",
    icon: BarChart3,
    component: UsageAnalytics,
  },
  {
    id: MENU_ITEM_IDS.MANAGED_SITE_CHANNELS,
    name: "",
    icon: Layers,
    component: managedSiteChannels,
  },
  {
    id: MENU_ITEM_IDS.MANAGED_SITE_MODEL_SYNC,
    name: "",
    icon: RefreshCcw,
    component: ManagedSiteModelSync,
  },
  {
    id: MENU_ITEM_IDS.IMPORT_EXPORT,
    name: "/",
    icon: ArrowLeftRight,
    component: ImportExport,
  },
  {
    id: MENU_ITEM_IDS.ABOUT,
    name: "",
    icon: Info,
    component: About,
  },
]

const DEV_MENU_ITEMS: MenuItem[] = []

if (import.meta.env.MODE === "development") {
  const MeshGradientLab = lazy(() => import("./pages/MeshGradientLab"))

  const MeshGradientLabComponent: ComponentType<any> = (props) =>
    createElement(
      Suspense,
      { fallback: null },
      createElement(MeshGradientLab, props),
    )

  DEV_MENU_ITEMS.push({
    id: DEV_MENU_ITEM_IDS.MESH_GRADIENT_LAB,
    name: "Mesh Gradient Lab (Dev)",
    icon: Palette,
    component: MeshGradientLabComponent,
  })
}

export const menuItems: MenuItem[] = [...BASE_MENU_ITEMS, ...DEV_MENU_ITEMS]
