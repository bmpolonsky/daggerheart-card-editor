import type { TemplateFeature } from "@/lib/api";

export const FALLBACK_FEATURE_NAME = "Без названия";

export function stripMarkdownLinks(value: string) {
  if (!value) return "";
  return value.replace(/\[([^[\]]+)\]\([^)]+\)/g, "$1");
}

export function normalizeFeatureName(feature?: TemplateFeature) {
  if (!feature) return "";
  return feature.name?.trim() || FALLBACK_FEATURE_NAME;
}

function formatFeatureContent(feature: TemplateFeature) {
  const text = feature.text?.trim();
  if (text) {
    return text;
  }

  const name = normalizeFeatureName(feature);
  return name;
}

export function buildAggregatedContent(features: TemplateFeature[]) {
  return features.map(formatFeatureContent).filter(Boolean).join("\n\n");
}
