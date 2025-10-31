import type { TemplateCategoryId } from "@/lib/api";

export type CardTypeId = TemplateCategoryId;

export interface CardTypeConfig {
  id: CardTypeId;
  name: string;
  cardLabel: string;
  baseClasses: string[];
  pathSegment: string;
  defaultDivider?: string;
  supportsBanner: boolean;
  supportsSpellcast: boolean;
  supportsTier: boolean;
  supportsStress: boolean;
  supportsDataClass: boolean;
  supportsDataDomain: boolean;
}

export const CARD_TYPE_CONFIG: Record<CardTypeId, CardTypeConfig> = {
  ancestry: {
    id: "ancestry",
    name: "Родословная",
    cardLabel: "Родословная",
    baseClasses: ["ancestry"],
    pathSegment: "ancestry",
    defaultDivider: "https://daggerheart.su/image/ancestry/divider.avif",
    supportsBanner: false,
    supportsSpellcast: false,
    supportsTier: false,
    supportsStress: false,
    supportsDataClass: false,
    supportsDataDomain: false,
  },
  community: {
    id: "community",
    name: "Сообщество",
    cardLabel: "Сообщество",
    baseClasses: ["community"],
    pathSegment: "community",
    defaultDivider: "https://daggerheart.su/image/community/divider.webp",
    supportsBanner: false,
    supportsSpellcast: false,
    supportsTier: false,
    supportsStress: false,
    supportsDataClass: false,
    supportsDataDomain: false,
  },
  subclass: {
    id: "subclass",
    name: "Подкласс",
    cardLabel: "Подкласс",
    baseClasses: ["subclass"],
    pathSegment: "subclass",
    defaultDivider: "",
    supportsBanner: true,
    supportsSpellcast: true,
    supportsTier: true,
    supportsStress: false,
    supportsDataClass: true,
    supportsDataDomain: false,
  },
  "domain-card": {
    id: "domain-card",
    name: "Карта Домена",
    cardLabel: "Карта Домена",
    baseClasses: ["domain_card"],
    pathSegment: "domain-card",
    defaultDivider: "",
    supportsBanner: true,
    supportsSpellcast: false,
    supportsTier: false,
    supportsStress: true,
    supportsDataClass: false,
    supportsDataDomain: true,
  },
};

export const CARD_TYPE_LIST = Object.values(CARD_TYPE_CONFIG);

export const DEFAULT_CARD_TYPE_ID: CardTypeId = "ancestry";

export interface CardFields {
  slug: string;
  customClasses: string;
  dataSource: string;
  dataClass: string;
  dataDomain: string;
  title: string;
  prelude: string;
  description: string;
  attribution: string;
  source: string;
  label: string;
  subclassTier: string;
  spellcast: string;
  bannerImage: string;
  bannerText: string;
  stressImage: string;
  stressText: string;
  dividerImage: string;
  buttonHref: string;
}

export function createEmptyCardFields(): CardFields {
  return {
    slug: "",
    customClasses: "",
    dataSource: "",
    dataClass: "",
    dataDomain: "",
    title: "",
    prelude: "",
    description: "",
    attribution: "",
    source: "",
    label: "",
    subclassTier: "",
    spellcast: "",
    bannerImage: "",
    bannerText: "",
    stressImage: "",
    stressText: "",
    dividerImage: "",
    buttonHref: "",
  };
}
