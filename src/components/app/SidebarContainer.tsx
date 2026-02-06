import type { TemplateCard } from "@/lib/api";
import { TemplateSidebar } from "@/components/template/TemplateSidebar";
import { useStore } from "@/lib/store";
import { templatesStore } from "@/stores/templates";
import { templatesService } from "@/services/templatesService";
import { editorService } from "@/services/editorService";
import { customCardsStore } from "@/stores/customCards";
import type { CustomCardRecord } from "@/services/customCardsService";

interface SidebarContainerProps {
  onOpenDomainManager: () => void;
}

export function SidebarContainer({ onOpenDomainManager }: SidebarContainerProps) {
  const { isLoading, error, searchTerm } = useStore(templatesStore);
  const { items: customCards } = useStore(customCardsStore);
  const configuredGroups = templatesService.buildGroupViews();

  const handleSearchChange = (value: string) => {
    templatesService.setSearchTerm(value);
  };

  const handleCardClick = (card: TemplateCard) => {
    editorService.selectCard(card);
  };

  const handleCustomCardClick = (record: CustomCardRecord) => {
    editorService.openCustomCard(record);
  };

  const handleCustomCardDelete = (record: CustomCardRecord) => {
    editorService.removeCustomCard(record.id);
  };

  return (
    <TemplateSidebar
      searchTerm={searchTerm}
      onSearchChange={handleSearchChange}
      isLoading={isLoading}
      error={error}
      groups={configuredGroups}
      onSelectCard={handleCardClick}
      customCards={customCards}
      onSelectCustomCard={handleCustomCardClick}
      onDeleteCustomCard={handleCustomCardDelete}
      onOpenDomainManager={onOpenDomainManager}
    />
  );
}
