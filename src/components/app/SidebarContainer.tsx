import type { TemplateCard } from "@/lib/api";
import { TemplateSidebar } from "@/components/template/TemplateSidebar";
import { useStore } from "@/lib/store";
import { templatesStore } from "@/stores/templates";
import { templatesService } from "@/services/templatesService";
import { editorService } from "@/services/editorService";

export function SidebarContainer() {
  const { isLoading, error, searchTerm } = useStore(templatesStore);
  const configuredGroups = templatesService.buildGroupViews();

  const handleSearchChange = (value: string) => {
    templatesService.setSearchTerm(value);
  };

  const handleCardClick = (card: TemplateCard) => {
    editorService.selectCard(card);
  };

  return (
    <TemplateSidebar
      searchTerm={searchTerm}
      onSearchChange={handleSearchChange}
      isLoading={isLoading}
      error={error}
      groups={configuredGroups}
      onSelectCard={handleCardClick}
    />
  );
}
