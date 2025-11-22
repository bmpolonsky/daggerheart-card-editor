import type { TemplateCard } from "@/lib/api";
import { CARD_TYPE_CONFIG, type CardFields, type CardTypeId, createEmptyCardFields } from "@/lib/cardTypes";
import { buildAggregatedContent, stripMarkdownLinks } from "@/lib/templateUtils";
import {
  ASSET_BASE_PATH,
  DOMAIN_STRESS_IMAGE,
  SPELLCAST_LABEL,
  SPELLCAST_TRAIT_TRANSLATIONS,
  DOMAIN_CARD_TYPE_LABELS,
} from "@/lib/constants";

function buildAsset(path: string | null | undefined) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${ASSET_BASE_PATH}${normalized}`;
}

function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function trimPlaytestPrefix(value: string | null | undefined) {
  if (!value) return "";
  return value.replace("playtest-", "");
}

function resolveDividerImage(card: TemplateCard, typeId: CardTypeId) {
  const typeConfig = CARD_TYPE_CONFIG[typeId];

  if (typeId === "subclass" && card.classSlug) {
    return buildAsset(`/image/class/divider/${trimPlaytestPrefix(card.classSlug)}.avif`);
  }

  if (typeId === "domain-card" && card.domainSlug) {
    return buildAsset(`/image/domain/divider/${trimPlaytestPrefix(card.domainSlug)}.avif`);
  }

  return typeConfig.defaultDivider ?? "";
}

function resolveBannerImage(card: TemplateCard, typeId: CardTypeId) {
  if (typeId === "subclass" && card.classSlug) {
    return buildAsset(`/image/class/banner/${trimPlaytestPrefix(card.classSlug)}.avif`);
  }

  if (typeId === "domain-card" && card.domainSlug) {
    return buildAsset(`/image/domain/banner/${trimPlaytestPrefix(card.domainSlug)}.avif`);
  }

  return "";
}

function resolveLabel(card: TemplateCard, typeId: CardTypeId) {
  const typeConfig = CARD_TYPE_CONFIG[typeId];

  if (typeId === "subclass") {
    return card.className ?? typeConfig.cardLabel;
  }

  if (typeId === "domain-card") {
    const normalized = card.cardType?.trim().toLowerCase() ?? "";
    const translated = DOMAIN_CARD_TYPE_LABELS[normalized];
    return translated ?? capitalize(card.cardType ?? typeConfig.cardLabel);
  }

  return typeConfig.cardLabel;
}

function resolveSpellcast(card: TemplateCard, typeId: CardTypeId) {
  if (typeId !== "subclass") {
    return "";
  }

  if (!card.spellcastTrait) {
    return "";
  }

  const normalized = card.spellcastTrait.trim().toLowerCase();
  const translated = SPELLCAST_TRAIT_TRANSLATIONS[normalized] ?? capitalize(card.spellcastTrait);
  return `***${SPELLCAST_LABEL}:*** ${translated}`;
}

function resolveDescription(card: TemplateCard, typeId: CardTypeId) {
  if (typeId === "subclass") {
    return stripMarkdownLinks(card.features[0]?.text ?? "");
  }

  return buildAggregatedContent(card.features);
}

export function buildCardFieldsFromTemplate(card: TemplateCard) {
  const typeId = card.category as CardTypeId;
  const typeConfig = CARD_TYPE_CONFIG[typeId];
  const description = resolveDescription(card, typeId);
  const label = resolveLabel(card, typeId);

  const cardFields: CardFields = {
    ...createEmptyCardFields(),
    slug: card.slug,
    customClasses: [card.slug, card.classSlug, card.domainSlug, card.cardType]
      .filter(Boolean)
      .join(" "),
    dataSource: card.sourceName ?? "",
    dataClass: card.classSlug ?? "",
    dataDomain: card.domainSlug ?? "",
    title: card.name,
    prelude: stripMarkdownLinks(card.description ?? ""),
    description,
    attribution: card.artAttribution ?? "",
    source: card.sourceName ?? "",
    label,
    subclassTier: typeConfig.supportsTier ? card.features[0]?.group ?? "" : "",
    spellcast: resolveSpellcast(card, typeId),
    bannerImage: resolveBannerImage(card, typeId),
    bannerText:
      typeId === "domain-card" && card.level != null ? String(card.level) : "",
    dividerImage: resolveDividerImage(card, typeId),
    stressImage: typeId === "domain-card" ? DOMAIN_STRESS_IMAGE : "",
    stressText:
      typeId === "domain-card" && card.stressCost != null
        ? String(card.stressCost)
        : "",
    buttonHref: `/${typeConfig.pathSegment}/${card.slug}`,
  };

  return {
    cardFields,
    typeId,
    selectedFeatureIndex: 0,
  };
}
