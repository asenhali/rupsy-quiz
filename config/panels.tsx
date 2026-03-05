import type { PanelDef } from "@/components/AppView";
import HomePanel from "@/components/panels/HomePanel";
import FriendsPanel from "@/components/panels/FriendsPanel";
import SettingsPanel from "@/components/panels/SettingsPanel";
import ShopPanel from "@/components/panels/ShopPanel";
import VybavaPanel from "@/components/panels/VybavaPanel";

export const PANELS: PanelDef[] = [
  { route: "/shop", label: "Obchod", component: <ShopPanel /> },
  { route: "/vybava", label: "Výbava", component: <VybavaPanel /> },
  { route: "/", label: "Domov", component: <HomePanel /> },
  { route: "/friends", label: "Priatelia", component: <FriendsPanel /> },
  { route: "/settings", label: "Nastavenia", component: <SettingsPanel /> },
];
