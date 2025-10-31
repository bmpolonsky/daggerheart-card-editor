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

const ASSET_BASE = "https://daggerheart.su";

const DOMAIN_STRESS_IMAGE = `${ASSET_BASE}/image/domain/stress-cost.avif`;

function buildAsset(path: string | null | undefined) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${ASSET_BASE}${normalized}`;
}

function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
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

    const customClasses = [
      card.slug,
      card.classSlug,
      card.domainSlug,
      card.cardType,
    ]
      .filter(Boolean)
      .join(" ");

    const dividerImage =
      card.category === "subclass" && card.classSlug
        ? buildAsset(`/image/class/divider/${card.classSlug}.avif`)
        : card.category === "domain-card" && card.domainSlug
        ? buildAsset(`/image/domain/divider/${card.domainSlug}.avif`)
        : typeConfig.defaultDivider ?? "";

    const bannerImage =
      card.category === "subclass" && card.classSlug
        ? buildAsset(`/image/class/banner/${card.classSlug}.avif`)
        : card.category === "domain-card" && card.domainSlug
        ? buildAsset(`/image/domain/banner/${card.domainSlug}.avif`)
        : "";

    const label =
      card.category === "subclass"
        ? card.className ?? typeConfig.cardLabel
        : card.category === "domain-card"
        ? capitalize(card.cardType ?? typeConfig.cardLabel)
        : typeConfig.cardLabel;

    const spellcast =
      card.category === "subclass" && card.spellcastTrait
        ? `***Spellcast:*** ${capitalize(card.spellcastTrait)}`
        : "";

    const nextFields: CardFields = {
      ...createEmptyCardFields(),
      slug: card.slug,
      customClasses,
      dataSource: card.sourceName ?? "",
      dataClass: card.classSlug ?? "",
      dataDomain: card.domainSlug ?? "",
      title: card.name,
      prelude,
      description,
      attribution: card.artAttribution ?? "",
      source: card.sourceName ?? "",
      label,
      subclassTier: typeConfig.supportsTier ? card.features[0]?.group ?? "" : "",
      spellcast,
      bannerImage,
      bannerText:
        card.category === "domain-card" && card.level != null
          ? String(card.level)
          : "",
      dividerImage,
      stressImage: card.category === "domain-card" ? DOMAIN_STRESS_IMAGE : "",
      stressText:
        card.category === "domain-card" && card.stressCost != null
          ? String(card.stressCost)
          : "",
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
