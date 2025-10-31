import { useCallback, useMemo } from "preact/hooks";
import type { TemplateCard } from "@/lib/api";
import {
  TemplateSidebar,
  type TemplateGroupView,
} from "@/components/template/TemplateSidebar";
import { useStore } from "@/lib/store";
import { templatesStore } from "@/stores/templates";
import { editorStore } from "@/stores/editor";
import { exportStore } from "@/stores/export";
import {
  CARD_TYPE_CONFIG,
  createEmptyCardFields,
  type CardFields,
} from "@/lib/cardTypes";
import { buildAggregatedContent, stripMarkdownLinks } from "@/lib/templateUtils";

interface SidebarContainerProps {
  onReload: () => void;
}

export function SidebarContainer({ onReload }: SidebarContainerProps) {
  const { templateGroups, expandedGroups, searchTerm, isLoading, error } =
    useStore(templatesStore);

  const toggleGroup = useCallback((groupId: string) => {
    templatesStore.update((state) => ({
      ...state,
      expandedGroups: {
        ...state.expandedGroups,
        [groupId]: !(state.expandedGroups[groupId] ?? false),
      },
    }));
  }, []);

  const configuredGroups = useMemo<TemplateGroupView[]>(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return templateGroups.map((group) => {
      const filteredItems = normalizedSearch
        ? group.items.filter((card) => card.name.toLowerCase().includes(normalizedSearch))
        : group.items;

      return {
        ...group,
        filteredItems,
        expanded: expandedGroups[group.id] ?? false,
        toggle: () => toggleGroup(group.id),
      };
    });
  }, [expandedGroups, searchTerm, templateGroups, toggleGroup]);

  const handleSearchChange = useCallback((value: string) => {
    templatesStore.update((state) => ({
      ...state,
      searchTerm: value,
    }));
  }, []);

  const handleCardClick = useCallback((card: TemplateCard) => {
    const typeConfig = CARD_TYPE_CONFIG[card.category];
    const prelude = stripMarkdownLinks(card.description ?? "");
    const description =
      card.category === "subclass"
        ? stripMarkdownLinks(card.features[0]?.text ?? "")
        : buildAggregatedContent(card.features);

    const nextFields: CardFields = {
      ...createEmptyCardFields(),
      slug: card.slug,
      customClasses: card.slug,
      dataSource: card.sourceName ?? "",
      title: card.name,
      prelude,
      description,
      source: card.sourceName ?? "",
      label: typeConfig.cardLabel,
      subclassTier: typeConfig.supportsTier ? card.features[0]?.group ?? "" : "",
      dividerImage: typeConfig.defaultDivider ?? "",
      buttonHref: `https://daggerheart.su/${typeConfig.pathSegment}/${card.slug}`,
    };

    editorStore.update(() => ({
      selectedCard: card,
      selectedTypeId: card.category,
      cardFields: nextFields,
      customImage: null,
      selectedFeatureIndex: 0,
    }));

    exportStore.update(() => ({
      isExporting: false,
      exportError: null,
    }));
  }, []);

  return (
    <TemplateSidebar
      searchTerm={searchTerm}
      onSearchChange={handleSearchChange}
      isLoading={isLoading}
      error={error}
      groups={configuredGroups}
      onReload={onReload}
      onSelectCard={handleCardClick}
    />
  );
}
