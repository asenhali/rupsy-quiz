import type { PanelDef } from "@/components/AppView";
import HomePanel from "@/components/panels/HomePanel";
import FriendsPanel from "@/components/panels/FriendsPanel";
import SettingsPanel from "@/components/panels/SettingsPanel";
import PlaceholderLeftPanel from "@/components/panels/PlaceholderLeftPanel";
import PlaceholderRightPanel from "@/components/panels/PlaceholderRightPanel";

export const PANELS: PanelDef[] = [
  { route: "/settings", label: "Settings", component: <SettingsPanel /> },
  { route: "/placeholder-left", label: "Left", component: <PlaceholderLeftPanel /> },
  { route: "/", label: "Home", component: <HomePanel /> },
  { route: "/friends", label: "Friends", component: <FriendsPanel /> },
  { route: "/placeholder-right", label: "Right", component: <PlaceholderRightPanel /> },
];
