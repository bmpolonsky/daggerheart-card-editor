import "./App.css";
import { SidebarContainer } from "@/components/app/SidebarContainer";
import { WorkspaceContainer } from "@/components/app/WorkspaceContainer";
import { templatesService } from "@/services/templatesService";

export default function App() {
  templatesService.ensureLoaded();

  return (
    <div className="app-shell russian">
      <SidebarContainer onReload={() => void templatesService.reload()} />
      <WorkspaceContainer />
    </div>
  );
}
