const API_HOST = "https://daggerheart.su";
const API_BASE_PATH = "/api";
const API_BASE_URL = import.meta.env.DEV ? API_BASE_PATH : `${API_HOST}${API_BASE_PATH}`;

export type TemplateCategoryId = "subclass" | "ancestry" | "community" | "domain-card";

const CATEGORY_CONFIG: Record<
  TemplateCategoryId,
  {
    endpoint: string;
    title: string;
  }
> = {
  subclass: { endpoint: "subclass", title: "Подкласс" },
  ancestry: { endpoint: "ancestry", title: "Родословная" },
  community: { endpoint: "community", title: "Сообщество" },
  "domain-card": { endpoint: "domain-card", title: "Карта Домена" },
};

export interface TemplateFeature {
  id: number | string;
  name: string;
  text: string;
  group?: string;
}

export interface TemplateCard {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  description: string | null;
  sourceName: string | null;
  category: TemplateCategoryId;
  features: TemplateFeature[];
}

export interface TemplateGroup {
  id: TemplateCategoryId;
  title: string;
  items: TemplateCard[];
}

export interface TemplateCollectionResponse {
  templateGroups: TemplateGroup[];
  fetchedAt: string;
}

interface ApiResponse<T> {
  result: "ok" | "error";
  data: T;
}

type RawFeature = {
  id: number | string;
  name: string;
  main_body?: string;
};

type RawTemplateItem = {
  slug: string;
  name: string;
  short_description?: string;
  main_body?: string;
  description?: string;
  image_url?: string | null;
  source_name?: string | null;
  features?: RawFeature[];
  foundation_features?: RawFeature[];
  specialization_features?: RawFeature[];
  mastery_features?: RawFeature[];
};

function resolveImage(imageUrl?: string | null) {
  if (!imageUrl) {
    return null;
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  try {
    return new URL(imageUrl, API_HOST).toString();
  } catch {
    return null;
  }
}

const SUBCLASS_FEATURE_KEYS = [
  "foundation_features",
  "specialization_features",
  "mastery_features",
] as const;

const SUBCLASS_GROUP_LABEL: Record<(typeof SUBCLASS_FEATURE_KEYS)[number], string> = {
  foundation_features: "Базовая особенность",
  specialization_features: "Специализация",
  mastery_features: "Мастерство",
};

function formatFeatureText(feature: RawFeature) {
  const title = feature.name?.trim();
  const body = feature.main_body?.trim() ?? "";

  if (title && body) {
    return `***${title}:*** ${body}`;
  }

  if (title) {
    return `***${title}***`;
  }

  return body;
}

function extractFeatures(category: TemplateCategoryId, item: RawTemplateItem): TemplateFeature[] {
  const features: TemplateFeature[] = [];

  if (category === "subclass") {
    for (const key of SUBCLASS_FEATURE_KEYS) {
      const list = item[key];

      if (!Array.isArray(list)) continue;

      const groupLabel = SUBCLASS_GROUP_LABEL[key];
      const lines = list.map((feature) => formatFeatureText(feature)).filter(Boolean);
      if (lines.length === 0) continue;

      const mergedText = [`***${groupLabel}:***`, ...lines].join("\n\n");

      features.push({
        id: key,
        name: groupLabel,
        text: mergedText,
        group: groupLabel,
      });
    }

    return features;
  }

  if (!Array.isArray(item.features)) {
    return features;
  }

  for (const feature of item.features) {
    features.push({
      id: feature.id,
      name: feature.name,
      text: formatFeatureText(feature),
    });
  }

  return features;
}

function mapTemplateItem(category: TemplateCategoryId, item: RawTemplateItem): TemplateCard {
  const features = extractFeatures(category, item);

  return {
    id: item.slug,
    slug: item.slug,
    name: item.name,
    image: resolveImage(item.image_url),
    description:
      item.short_description?.trim() ||
      item.description?.trim() ||
      item.main_body?.trim() ||
      null,
    sourceName: item.source_name ?? null,
    category,
    features,
  };
}

async function fetchCategory(category: TemplateCategoryId): Promise<TemplateGroup> {
  const config = CATEGORY_CONFIG[category];
  const response = await fetch(`${API_BASE_URL}/${config.endpoint}?lang=ru`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Не удалось загрузить ${config.title.toLowerCase()} (статус ${response.status})`
    );
  }

  const payload = (await response.json()) as ApiResponse<RawTemplateItem[]>;

  if (payload.result !== "ok" || !Array.isArray(payload.data)) {
    throw new Error(`Некорректный ответ для категории ${config.title}`);
  }

  return {
    id: category,
    title: config.title,
    items: payload.data.map((item) => mapTemplateItem(category, item)),
  };
}

export async function fetchTemplateCollection(): Promise<TemplateCollectionResponse> {
  const templateGroups = await Promise.all(
    (Object.keys(CATEGORY_CONFIG) as TemplateCategoryId[]).map((category) =>
      fetchCategory(category)
    )
  );

  return {
    templateGroups,
    fetchedAt: new Date().toISOString(),
  };
}
