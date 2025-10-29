import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { TargetedEvent } from "preact";
import {
  fetchTemplateCollection,
  type TemplateCard,
  type TemplateCollectionResponse,
  type TemplateGroup,
  type TemplateFeature,
  type TemplateCategoryId,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  IconClose,
  IconRotateCw,
  IconSearch,
  IconUpload,
} from "@/components/icons";
import "./App.css";
import "@/external/daggerheart-cards.css";
import { renderMarkdown } from "@/lib/markdown";

type TemplateGroupConfig = TemplateGroup & {
  filteredItems: TemplateCard[];
  expanded: boolean;
  toggle: () => void;
};

const FALLBACK_FEATURE_NAME = "Без названия";

function normalizeFeatureName(feature?: TemplateFeature) {
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

const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;

function stripMarkdownLinks(value: string) {
  return value.replace(LINK_PATTERN, "$1");
}

function buildAggregatedContent(features: TemplateFeature[]) {
  return stripMarkdownLinks(
    features.map(formatFeatureContent).filter(Boolean).join("\n\n")
  );
}

type CardTypeId = TemplateCategoryId;

interface CardTypeConfig {
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

const CARD_TYPE_CONFIG: Record<CardTypeId, CardTypeConfig> = {
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

const CARD_TYPE_LIST = Object.values(CARD_TYPE_CONFIG);
const DEFAULT_CARD_TYPE_ID: CardTypeId = "ancestry";

interface CardFields {
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

function createEmptyCardFields(): CardFields {
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

const EXPORT_PLACEHOLDER_IMAGE =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" fill="#9ca3af" font-size="18" font-family="sans-serif" dominant-baseline="middle" text-anchor="middle">Изображение недоступно при экспорте</text></svg>`
  );

async function inlineExternalImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
  const restoreCallbacks: Array<() => void> = [];

  const toDataUrl = async (url: string) => {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) throw new Error(`Failed to load ${url} (${response.status})`);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  };

  const buildProxyUrl = (url: string) => {
    const clean = url.replace(/^https?:\/\//, "");
    return `https://images.weserv.nl/?url=${encodeURIComponent(clean)}&default=404&output=png`;
  };

  await Promise.all(
    images.map(async (img) => {
      const src = img.currentSrc || img.getAttribute("src");
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) {
        return;
      }

      const originalSrc = img.getAttribute("src") ?? "";
      const originalSrcSet = img.getAttribute("srcset");
      const originalCrossOrigin = img.getAttribute("crossorigin");

      const applyPlaceholder = () => {
        if (originalSrcSet) img.removeAttribute("srcset");
        img.setAttribute("src", EXPORT_PLACEHOLDER_IMAGE);
        restoreCallbacks.push(() => {
          img.setAttribute("src", originalSrc);
          if (originalSrcSet) {
            img.setAttribute("srcset", originalSrcSet);
          } else {
            img.removeAttribute("srcset");
          }
          if (originalCrossOrigin) {
            img.setAttribute("crossorigin", originalCrossOrigin);
          } else {
            img.removeAttribute("crossorigin");
          }
        });
      };

      try {
        let dataUrl: string | null = null;

        try {
          dataUrl = await toDataUrl(src);
        } catch (primaryError) {
          console.warn("Image inline failed, retry via proxy", primaryError);
          try {
            dataUrl = await toDataUrl(buildProxyUrl(src));
          } catch (proxyError) {
            console.warn("Proxy inline failed", proxyError);
            dataUrl = null;
          }
        }

        if (!dataUrl) {
          applyPlaceholder();
          return;
        }

        img.setAttribute("crossorigin", "anonymous");
        if (originalSrcSet) img.removeAttribute("srcset");
        img.setAttribute("src", dataUrl);

        restoreCallbacks.push(() => {
          img.setAttribute("src", originalSrc);
          if (originalSrcSet) {
            img.setAttribute("srcset", originalSrcSet);
          } else {
            img.removeAttribute("srcset");
          }
          if (originalCrossOrigin) {
            img.setAttribute("crossorigin", originalCrossOrigin);
          } else {
            img.removeAttribute("crossorigin");
          }
        });
      } catch (error) {
        console.warn("Failed to inline image", error);
        applyPlaceholder();
      }
    })
  );

  return () => {
    restoreCallbacks.forEach((restore) => restore());
  };
}

export default function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [templateGroups, setTemplateGroups] = useState<TemplateGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [selectedCard, setSelectedCard] = useState<TemplateCard | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedTypeId, setSelectedTypeId] = useState<CardTypeId>(DEFAULT_CARD_TYPE_ID);
  const [cardFields, setCardFields] = useState<CardFields>(() => createEmptyCardFields());
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [selectedFeatureIndex, setSelectedFeatureIndex] = useState(0);

  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const onFieldInput = <Element extends HTMLInputElement | HTMLTextAreaElement>(
    setter: (value: string) => void,
    transform?: (value: string) => string
  ) => (event: TargetedEvent<Element, Event>) => {
    const value = event.currentTarget.value;
    setter(transform ? transform(value) : value);
  };

  const onCardFieldInput = <
    Element extends HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  >(
    field: keyof CardFields,
    transform?: (value: string) => string
  ) => (event: TargetedEvent<Element, Event>) => {
    const value = event.currentTarget.value;
    setCardFields((prev) => ({
      ...prev,
      [field]: transform ? transform(value) : value,
    }));
  };

  const applyTemplatePayload = ({
    templateGroups: groups,
    fetchedAt,
  }: TemplateCollectionResponse) => {
    setTemplateGroups(groups);
    setLastFetchedAt(fetchedAt);
    setExpandedGroups((prev) => {
      const next: Record<string, boolean> = {};

      groups.forEach((group, index) => {
        next[group.id] = prev[group.id] ?? index === 0;
      });

      return next;
    });
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchTemplateCollection();
        if (!isMounted) return;
        applyTemplatePayload(data);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : "Неизвестная ошибка";
        setError(message);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleReloadTemplates = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchTemplateCollection();
      applyTemplatePayload(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Неизвестная ошибка";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const configureGroup = (group: TemplateGroup): TemplateGroupConfig => {
    const filteredItems = normalizedSearch
      ? group.items.filter((card) => card.name.toLowerCase().includes(normalizedSearch))
      : group.items;

    const toggle = () => {
      setExpandedGroups((state) => ({
        ...state,
        [group.id]: !state[group.id],
      }));
    };

    return {
      ...group,
      filteredItems,
      expanded: expandedGroups[group.id] ?? false,
      toggle,
    };
  };

  const handleCardClick = (card: TemplateCard) => {
    const typeConfig = CARD_TYPE_CONFIG[card.category];
    const prelude = stripMarkdownLinks(card.description ?? "");
    const description =
      card.category === "subclass"
        ? stripMarkdownLinks(card.features[0]?.text ?? "")
        : buildAggregatedContent(card.features);

    setSelectedCard(card);
    setSelectedTypeId(card.category);
    setSelectedFeatureIndex(0);
    setExportError(null);
    setIsExporting(false);
    setCustomImage(null);

    setCardFields({
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
    });
  };

  const handleCloseEditor = () => {
    setSelectedCard(null);
    setCustomImage(null);
    setSelectedTypeId(DEFAULT_CARD_TYPE_ID);
    setCardFields(createEmptyCardFields());
  };

  const handleImageUpload = (event: TargetedEvent<HTMLInputElement, Event>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setCustomImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubclassFeatureChange = (event: TargetedEvent<HTMLSelectElement, Event>) => {
    const index = Number(event.currentTarget.value);
    setSelectedFeatureIndex(index);

    const feature = selectedCard?.features[index];
    setCardFields((prev) => ({
      ...prev,
      description: stripMarkdownLinks(feature?.text ?? ""),
      subclassTier: feature?.group ?? prev.subclassTier,
    }));
  };

  const handleTypeChange = (event: TargetedEvent<HTMLSelectElement, Event>) => {
    const nextType = event.currentTarget.value as CardTypeId;
    setSelectedTypeId(nextType);
    setCardFields((prev) => {
      const nextConfig = CARD_TYPE_CONFIG[nextType];
      return {
        ...prev,
        label: prev.label || nextConfig.cardLabel,
        dividerImage: prev.dividerImage || nextConfig.defaultDivider || "",
      };
    });
  };

  const handleExportPNG = async () => {
    if (!cardRef.current) return;

    setExportError(null);
    setIsExporting(true);

    let restoreImages: (() => void) | undefined;

    try {
      restoreImages = await inlineExternalImages(cardRef.current);
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "transparent",
        skipFonts: false,
      });

      const link = document.createElement("a");
      const safeTitle = cardFields.title.trim() || "карта";
      link.download = `${safeTitle}-карта.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("PNG export failed", err);
      setExportError("Не удалось экспортировать PNG. Попробуйте ещё раз.");
    } finally {
      restoreImages?.();
      setIsExporting(false);
    }
  };

  const lastUpdatedLabel = useMemo(() => {
    if (!lastFetchedAt) {
      return null;
    }

    try {
      return new Date(lastFetchedAt).toLocaleString("ru-RU", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return null;
    }
  }, [lastFetchedAt]);

  const renderTemplateGroup = (group: TemplateGroupConfig) => (
    <div key={group.id} className="template-group">
      <button type="button" className="template-group__toggle" onClick={group.toggle}>
        <span className="template-group__title">{group.title}</span>
        <div className="template-group__meta">
          <span className="template-group__count">{group.filteredItems.length}</span>
          <span
            className={cn(
              "template-group__chevron",
              !group.expanded && "template-group__chevron--collapsed"
            )}
          >
            −
          </span>
        </div>
      </button>
      {group.expanded && group.filteredItems.length > 0 && (
        <div className="template-grid">
          {group.filteredItems.map((card) => (
            <div
              key={card.id}
              className="template-card"
              onClick={() => handleCardClick(card)}
            >
              {card.image ? (
                <img src={card.image} alt={card.name} className="template-card__image" />
              ) : (
                <div className="template-card__placeholder">Нет изображения</div>
              )}
              <div className="template-card__label">{card.name}</div>
            </div>
          ))}
        </div>
      )}
      {group.expanded && group.filteredItems.length === 0 && (
        <div className="template-group__empty">Нет карточек по запросу</div>
      )}
    </div>
  );

  const cardImage = customImage ?? (selectedCard?.image ?? null);
  const typeConfig = CARD_TYPE_CONFIG[selectedTypeId];
  const isSubclass = selectedTypeId === "subclass";
  const preludeHtml = useMemo(
    () => renderMarkdown(cardFields.prelude),
    [cardFields.prelude]
  );
  const descriptionHtml = useMemo(
    () => renderMarkdown(cardFields.description),
    [cardFields.description]
  );
  const spellcastHtml = useMemo(() => {
    const html = renderMarkdown(cardFields.spellcast);
    return html.replace(/^<p>/, "").replace(/<\/p>$/, "");
  }, [cardFields.spellcast]);
  const cardClassName = cn(
    "card",
    ...typeConfig.baseClasses,
    cardFields.customClasses && cardFields.customClasses
  );
  const cardAttributes: Record<string, string> = {
    ...(cardFields.dataSource && { "data-source": cardFields.dataSource }),
  };
  if (typeConfig.supportsDataClass && cardFields.dataClass) {
    cardAttributes["data-class"] = cardFields.dataClass;
  }
  if (typeConfig.supportsTier && cardFields.subclassTier) {
    cardAttributes["data-subclass-tier"] = cardFields.subclassTier;
  }
  if (typeConfig.supportsDataDomain && cardFields.dataDomain) {
    cardAttributes["data-domain"] = cardFields.dataDomain;
  }
  const cardLabel = cardFields.label || typeConfig.cardLabel;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__search">
          <div className="sidebar__search-field">
            <IconSearch className="sidebar__search-icon" />
            <Input
              type="text"
              placeholder="Поиск по шаблонам..."
              value={searchTerm}
              onInput={onFieldInput<HTMLInputElement>(setSearchTerm)}
              className="input--search"
            />
          </div>
        </div>

        <div className="sidebar__templates">
          <div className="sidebar__templates-header">
            <h2 className="template-group__title">Категории карт</h2>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Обновить шаблоны"
              onClick={handleReloadTemplates}
              disabled={isLoading}
            >
              <IconRotateCw className={cn(isLoading && "sidebar__spinner")} />
            </Button>
          </div>

          <div className="sidebar__scroll">
            {isLoading && (
              <div className="sidebar__status" role="status">
                Загружаем шаблоны…
              </div>
            )}
            {error && !isLoading && (
              <div className="sidebar__status sidebar__status--error" role="alert">
                {error}
              </div>
            )}
            {templateGroups.map((group) => renderTemplateGroup(configureGroup(group)))}
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="workspace__header">
          <Button variant="ghost" size="icon" className="workspace__menu" aria-label="Меню">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </Button>
          {selectedCard && (
            <div className="workspace__selection">
              <span className="workspace__selection-label">
                {cardFields.title || "Без названия"}
              </span>
              <Button variant="ghost" size="icon" aria-label="Закрыть редактор" onClick={handleCloseEditor}>
                <IconClose />
              </Button>
            </div>
          )}
        </header>

        <div className="workspace__body">
          {selectedCard ? (
            <>
              <section className="editor-panel">
                <div className="editor-panel__headline">
                  <h1>{typeConfig.name}</h1>
                  <p className="editor-panel__timestamp">
                    Последнее обновление: {lastUpdatedLabel ?? "—"}
                  </p>
                </div>

                <div className="card-preview-wrapper">
                  <div className="card-preview card-preview-scope">
                    <div className="card_holder print">
                      <div
                        ref={cardRef}
                        id={cardFields.slug || undefined}
                        className={cardClassName}
                        {...cardAttributes}
                      >
                        <a
                          href={cardFields.buttonHref || undefined}
                          className="button"
                          aria-label="Открыть оригинал"
                          style={{ pointerEvents: "none" }}
                        />
                        <div
                          className="image card-preview__image"
                          role="button"
                          tabIndex={0}
                          onClick={() => fileInputRef.current?.click()}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              fileInputRef.current?.click();
                            }
                          }}
                        >
                          {cardImage ? (
                            <img
                              src={cardImage}
                              alt={
                                customImage
                                  ? "Пользовательское изображение"
                                  : selectedCard?.name ?? "Изображение"
                              }
                              className="card_image"
                            />
                          ) : (
                            <div className="card-preview__image-placeholder">
                              <div className="card-preview__upload-icon">
                                <IconUpload width={24} height={24} stroke="#4b5563" />
                              </div>
                              <p>Загрузить изображение</p>
                            </div>
                          )}
                        </div>
                        {typeConfig.supportsStress && cardFields.stressImage && (
                          <img className="stress_image" src={cardFields.stressImage} alt="" />
                        )}
                        {typeConfig.supportsStress && cardFields.stressText && (
                          <p className="stress_text">{cardFields.stressText}</p>
                        )}
                        {typeConfig.supportsBanner && cardFields.bannerImage && (
                          <img className="banner_image" src={cardFields.bannerImage} alt="" />
                        )}
                        {typeConfig.supportsBanner && cardFields.bannerText && (
                          <p className="banner_text">{cardFields.bannerText}</p>
                        )}
                        <p className="attribution">{cardFields.attribution}</p>
                        <p className="source">{cardFields.source}</p>

                        <div className="flex">
                          <div className="display">
                            <div className="background" />
                            <div className="text">
                              <p className="title">{cardFields.title || "Без названия"}</p>
                              {typeConfig.supportsTier && cardFields.subclassTier && (
                                <p className="subclass_tier">{cardFields.subclassTier}</p>
                              )}
                              {typeConfig.supportsSpellcast && cardFields.spellcast && (
                                <p
                                  className="spellcast"
                                  dangerouslySetInnerHTML={{ __html: spellcastHtml }}
                                />
                              )}
                              {cardFields.prelude.trim() && (
                                <div
                                  className="prelude"
                                  dangerouslySetInnerHTML={{ __html: preludeHtml }}
                                />
                              )}
                              {cardFields.description.trim() && (
                                <div
                                  className="description"
                                  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                                />
                              )}
                            </div>
                          </div>
                          {cardFields.dividerImage ? (
                            <img className="divider" src={cardFields.dividerImage} alt="" />
                          ) : (
                            <div className="card-preview__divider-placeholder" />
                          )}
                          <p className="label">{cardLabel}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    hidden
                  />
                </div>
              </section>

              <aside className="properties-panel">
                <div className="properties-section">
                  <h3>Тип карты</h3>
                  <div className="properties-field">
                    <label htmlFor="card-type">Категория</label>
                    <select
                      id="card-type"
                      className="card-feature-editor__select"
                      value={selectedTypeId}
                      onChange={handleTypeChange}
                    >
                      {CARD_TYPE_LIST.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="properties-section properties-section--form">
                  <h3>Основные поля</h3>
                  <div className="properties-field">
                    <label htmlFor="card-title">Заголовок</label>
                    <Input
                      id="card-title"
                      value={cardFields.title}
                      onInput={onCardFieldInput<HTMLInputElement>("title")}
                    />
                  </div>
                  <div className="properties-field">
                    <label htmlFor="card-label">Подпись</label>
                    <Input
                      id="card-label"
                      value={cardFields.label}
                      placeholder={typeConfig.cardLabel}
                      onInput={onCardFieldInput<HTMLInputElement>("label")}
                    />
                  </div>
                  <div className="properties-field">
                    <label htmlFor="card-source">Источник</label>
                    <Input
                      id="card-source"
                      value={cardFields.source}
                      onInput={onCardFieldInput<HTMLInputElement>("source")}
                    />
                  </div>
                  <div className="properties-field">
                    <label htmlFor="card-attribution">Автор</label>
                    <Input
                      id="card-attribution"
                      value={cardFields.attribution}
                      onInput={onCardFieldInput<HTMLInputElement>("attribution")}
                    />
                  </div>
                  <div className="properties-field">
                    <label htmlFor="card-prelude">Прелюдия</label>
                    <textarea
                      id="card-prelude"
                      className="properties-textarea"
                      value={cardFields.prelude}
                      onInput={onCardFieldInput<HTMLTextAreaElement>("prelude", stripMarkdownLinks)}
                      rows={3}
                    />
                  </div>
                  <div className="properties-field">
                    <label htmlFor="card-description">Описание</label>
                    <textarea
                      id="card-description"
                      className="card-content-textarea"
                      value={cardFields.description}
                      onInput={onCardFieldInput<HTMLTextAreaElement>(
                        "description",
                        stripMarkdownLinks
                      )}
                      rows={isSubclass ? 12 : 14}
                    />
                  </div>
                  {isSubclass && selectedCard && selectedCard.features.length > 0 && (
                    <div className="properties-field">
                      <label htmlFor="card-feature">Раздел</label>
                      <select
                        id="card-feature"
                        className="card-feature-editor__select"
                        value={String(selectedFeatureIndex)}
                        onChange={handleSubclassFeatureChange}
                      >
                        {selectedCard.features.map((feature, index) => (
                          <option key={feature.id} value={index}>
                            {feature.group
                              ? `${feature.group} · ${normalizeFeatureName(feature)}`
                              : normalizeFeatureName(feature)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {typeConfig.supportsTier && (
                    <div className="properties-field">
                      <label htmlFor="card-tier">Уровень</label>
                      <Input
                        id="card-tier"
                        value={cardFields.subclassTier}
                        onInput={onCardFieldInput<HTMLInputElement>("subclassTier")}
                      />
                    </div>
                  )}
                  {typeConfig.supportsSpellcast && (
                    <div className="properties-field">
                      <label htmlFor="card-spellcast">Spellcast</label>
                      <Input
                        id="card-spellcast"
                        value={cardFields.spellcast}
                        onInput={onCardFieldInput<HTMLInputElement>("spellcast", stripMarkdownLinks)}
                      />
                    </div>
                  )}
                </div>

                <div className="properties-section">
                  <h3>Медиа</h3>
                  <div className="properties-field">
                    <label htmlFor="card-divider">Разделитель</label>
                    <Input
                      id="card-divider"
                      value={cardFields.dividerImage}
                      placeholder={typeConfig.defaultDivider}
                      onInput={onCardFieldInput<HTMLInputElement>("dividerImage")}
                    />
                  </div>
                  {typeConfig.supportsBanner && (
                    <>
                      <div className="properties-field">
                        <label htmlFor="card-banner-image">Баннер</label>
                        <Input
                          id="card-banner-image"
                          value={cardFields.bannerImage}
                          onInput={onCardFieldInput<HTMLInputElement>("bannerImage")}
                        />
                      </div>
                      <div className="properties-field">
                        <label htmlFor="card-banner-text">Текст баннера</label>
                        <Input
                          id="card-banner-text"
                          value={cardFields.bannerText}
                          onInput={onCardFieldInput<HTMLInputElement>("bannerText")}
                        />
                      </div>
                    </>
                  )}
                  {typeConfig.supportsStress && (
                    <>
                      <div className="properties-field">
                        <label htmlFor="card-stress-image">Иконка стресса</label>
                        <Input
                          id="card-stress-image"
                          value={cardFields.stressImage}
                          onInput={onCardFieldInput<HTMLInputElement>("stressImage")}
                        />
                      </div>
                      <div className="properties-field">
                        <label htmlFor="card-stress-text">Стоимость</label>
                        <Input
                          id="card-stress-text"
                          value={cardFields.stressText}
                          onInput={onCardFieldInput<HTMLInputElement>("stressText")}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="properties-section">
                  <h3>Метаданные</h3>
                  <div className="properties-field">
                    <label htmlFor="card-slug">ID</label>
                    <Input
                      id="card-slug"
                      value={cardFields.slug}
                      onInput={onCardFieldInput<HTMLInputElement>("slug")}
                    />
                  </div>
                  <div className="properties-field">
                    <label htmlFor="card-classes">Доп. классы</label>
                    <Input
                      id="card-classes"
                      value={cardFields.customClasses}
                      placeholder="Например: bard spell"
                      onInput={onCardFieldInput<HTMLInputElement>("customClasses")}
                    />
                  </div>
                  <div className="properties-field">
                    <label htmlFor="card-data-source">data-source</label>
                    <Input
                      id="card-data-source"
                      value={cardFields.dataSource}
                      onInput={onCardFieldInput<HTMLInputElement>("dataSource")}
                    />
                  </div>
                  {typeConfig.supportsDataClass && (
                    <div className="properties-field">
                      <label htmlFor="card-data-class">data-class</label>
                      <Input
                        id="card-data-class"
                        value={cardFields.dataClass}
                        onInput={onCardFieldInput<HTMLInputElement>("dataClass")}
                      />
                    </div>
                  )}
                  {typeConfig.supportsDataDomain && (
                    <div className="properties-field">
                      <label htmlFor="card-data-domain">data-domain</label>
                      <Input
                        id="card-data-domain"
                        value={cardFields.dataDomain}
                        onInput={onCardFieldInput<HTMLInputElement>("dataDomain")}
                      />
                    </div>
                  )}
                  <div className="properties-field">
                    <label htmlFor="card-button-href">Ссылка</label>
                    <Input
                      id="card-button-href"
                      value={cardFields.buttonHref}
                      placeholder="https://..."
                      onInput={onCardFieldInput<HTMLInputElement>("buttonHref")}
                    />
                  </div>
                </div>

                <Button className="export-button" onClick={handleExportPNG} disabled={isExporting}>
                  {isExporting ? "Экспортируем…" : "Экспорт PNG"}
                </Button>
                {exportError && <p className="export-error">{exportError}</p>}
              </aside>
            </>
          ) : (
            <section className="empty-state">
              <div className="empty-state__icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  width="48"
                  height="48"
                >
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <path d="M2 10h20" />
                  <path d="M6 6V4" />
                  <path d="M10 6V4" />
                  <path d="M14 6V4" />
                  <path d="M18 6V4" />
                </svg>
              </div>
              <h2>Выберите шаблон слева</h2>
              <p>
                Нажмите на любую карточку, чтобы открыть рабочее пространство и начать редактировать.
              </p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
