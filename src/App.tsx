import "./App.css";
import { useState } from "preact/hooks";
import { SidebarContainer } from "@/components/app/SidebarContainer";
import { WorkspaceContainer } from "@/components/app/WorkspaceContainer";
import { DomainManager } from "@/components/domains/DomainManager";
import { templatesService } from "@/services/templatesService";
import { domainService } from "@/services/domainService";
import { editorService } from "@/services/editorService";
import { customCardsService } from "@/services/customCardsService";

export default function App() {
  templatesService.ensureLoaded();
  domainService.ensureLoaded();
  editorService.ensureHashSync();
  customCardsService.list();

  const [showDomainManager, setShowDomainManager] = useState(false);

  return (
    <div className="app-shell russian">
      <SidebarContainer onOpenDomainManager={() => setShowDomainManager(true)} />
      <WorkspaceContainer onOpenDomainManager={() => setShowDomainManager(true)} />
      {showDomainManager && <DomainManager onClose={() => setShowDomainManager(false)} />}
    </div>
  );
}
