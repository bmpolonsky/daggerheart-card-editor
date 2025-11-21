import "./App.css";
import "@/external/daggerheart-cards.css";
import { SidebarContainer } from "@/components/app/SidebarContainer";
import { WorkspaceContainer } from "@/components/app/WorkspaceContainer";
import { useTemplateLoader } from "@/hooks/useTemplateLoader";

export default function App() {
  const { reload } = useTemplateLoader();

  return (
    <div className="app-shell russian">
      <SidebarContainer onReload={reload} />
      <WorkspaceContainer />
    </div>
  );
}
