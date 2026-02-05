import "./App.css";
import { SidebarContainer } from "@/components/app/SidebarContainer";
import { WorkspaceContainer } from "@/components/app/WorkspaceContainer";
import { templatesService } from "@/services/templatesService";
import { domainService } from "@/services/domainService";

export default function App() {
  templatesService.ensureLoaded();
  domainService.ensureLoaded();

  return (
    <div className="app-shell russian">
      <SidebarContainer />
      <WorkspaceContainer />
    </div>
  );
}
