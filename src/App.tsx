import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { TargetedEvent } from "preact";
import {
  fetchTemplateCollection,
  type TemplateCard,
  type TemplateCollectionResponse,
  type TemplateGroup,
  type TemplateFeature,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  IconClose,
  IconGrid3x3,
  IconHelpCircle,
  IconRotateCw,
  IconSearch,
  IconUpload,
} from "@/components/icons";
import "./App.css";
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

  const [cardTitle, setCardTitle] = useState("");
  const [cardType, setCardType] = useState("");
  const [cardDescription, setCardDescription] = useState("");
  const [cardContent, setCardContent] = useState("");
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [selectedFeatureIndex, setSelectedFeatureIndex] = useState(0);

  const [damageThresholds, setDamageThresholds] = useState(false);
  const [cardBorder, setCardBorder] = useState(true);
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

  const categoryTitleMap = useMemo(() => {
    const map: Record<string, string> = {};

    for (const group of templateGroups) {
      map[group.id] = group.title;
    }

    return map;
  }, [templateGroups]);

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
    setSelectedCard(card);
    setCardTitle(card.name);
    const categoryTitle = categoryTitleMap[card.category] ?? card.category;
    setCardType(categoryTitle.toUpperCase());
    setCardDescription(stripMarkdownLinks(card.description ?? ""));
    setSelectedFeatureIndex(0);
    setExportError(null);
    setIsExporting(false);

    if (card.category === "subclass") {
      setCardContent(stripMarkdownLinks(card.features[0]?.text ?? ""));
    } else {
      setCardContent(buildAggregatedContent(card.features));
    }

    setCustomImage(null);
  };

  const handleCloseEditor = () => {
    setSelectedCard(null);
    setCustomImage(null);
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
    setCardContent(stripMarkdownLinks(feature?.text ?? ""));
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
      link.download = `${cardTitle.trim() || "карта"}-карта.png`;
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
  const isSubclass = selectedCard?.category === "subclass";
  const markdownHtml = useMemo(() => renderMarkdown(cardContent), [cardContent]);
  const textSummary = [
    cardTitle.trim() && `Название: ${cardTitle.trim()}`,
    cardType.trim() && `Тип: ${cardType.trim()}`,
    cardDescription.trim() && `Описание:\n${cardDescription.trim()}`,
    cardContent.trim() && `Контент:\n${cardContent.trim()}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const statusBadges: string[] = [];
  if (damageThresholds) statusBadges.push("Пороги урона");

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
              <span className="workspace__selection-label">{cardTitle}</span>
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
                  <h1>{cardType}</h1>
                  <p className="editor-panel__timestamp">
                    Последнее обновление: {lastUpdatedLabel ?? "—"}
                  </p>
                </div>

                <div
                  ref={cardRef}
                  className={cn(
                    "card-canvas",
                    "card-canvas--rounded",
                    cardBorder && "card-canvas--bordered",
                    damageThresholds && "card-canvas--damage"
                  )}
                >
                  {statusBadges.length > 0 && (
                    <div className="card-canvas__badges">
                      {statusBadges.map((badge) => (
                        <span key={badge} className="card-canvas__badge">
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="card-canvas__layout">
                      <div
                        className="card-canvas__dropzone"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {cardImage ? (
                          <img
                            src={cardImage}
                            alt={
                              customImage
                                ? "Пользовательское изображение"
                                : selectedCard?.name ?? "Изображение"
                            }
                            className="card-canvas__image"
                          />
                        ) : (
                          <div>
                            <div className="card-canvas__upload-icon">
                              <IconUpload width={24} height={24} stroke="#374151" />
                            </div>
                            <p style={{ textAlign: "center", color: "#4b5563", fontSize: "0.875rem" }}>
                              Загрузить изображение
                            </p>
                          </div>
                        )}
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: "none" }}
                      />

                      <div className="card-canvas__body">
                        <div className="card-canvas__title-row">
                          <h2 className="card-canvas__title">{cardTitle || "Без названия"}</h2>
                          <span className="card-canvas__type">{cardType || "—"}</span>
                        </div>

                        <div className="card-fields">
                          {cardDescription.trim() && (
                            <p className="card-canvas__description">{cardDescription}</p>
                          )}

                          {cardContent.trim() ? (
                            <div
                              className="card-canvas__markdown"
                              dangerouslySetInnerHTML={{ __html: markdownHtml }}
                            />
                          ) : (
                            <p className="card-canvas__placeholder">Добавьте текст в панели справа</p>
                          )}

                          {damageThresholds && (
                            <div className="card-canvas__thresholds">
                              <div className="card-threshold">
                                <div className="card-threshold__label">Minor Damage</div>
                                <div className="card-threshold__text">Mark 1 HP</div>
                                <div className="card-threshold__value">5</div>
                              </div>
                              <div className="card-threshold-break">5</div>
                              <div className="card-threshold">
                                <div className="card-threshold__label">Major Damage</div>
                                <div className="card-threshold__text">Mark 2 HP</div>
                                <div className="card-threshold__value">15</div>
                              </div>
                              <div className="card-threshold-break">15</div>
                              <div className="card-threshold">
                                <div className="card-threshold__label">Severe Damage</div>
                                <div className="card-threshold__text">Mark 3 HP</div>
                                <div className="card-threshold__value">25</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                </div>
              </section>

              <aside className="properties-panel">
                {selectedCard ? (
                  <>
                    <div className="properties-section properties-section--form">
                      <h3>Редактирование</h3>
                      <div className="properties-field">
                        <label htmlFor="card-title">Название</label>
                        <Input
                          id="card-title"
                          value={cardTitle}
                          onInput={onFieldInput<HTMLInputElement>(setCardTitle)}
                        />
                      </div>
                      <div className="properties-field">
                        <label htmlFor="card-type">Тип</label>
                        <Input
                          id="card-type"
                          value={cardType}
                          onInput={onFieldInput<HTMLInputElement>(setCardType)}
                        />
                      </div>
                      <div className="properties-field">
                        <label htmlFor="card-description">Описание</label>
                        <textarea
                          id="card-description"
                          className="properties-textarea"
                          value={cardDescription}
                          onInput={onFieldInput<HTMLTextAreaElement>(
                            setCardDescription,
                            stripMarkdownLinks
                          )}
                          rows={3}
                        />
                      </div>
                      {isSubclass && (
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
                      <div className="properties-field">
                        <label htmlFor="card-content">Контент</label>
                        <textarea
                          id="card-content"
                          className="card-content-textarea"
                          value={cardContent}
                          onInput={onFieldInput<HTMLTextAreaElement>(
                            setCardContent,
                            stripMarkdownLinks
                          )}
                          rows={isSubclass ? 12 : 14}
                        />
                      </div>
                    </div>

                    <div className="properties-section">
                      <h3>Оформление</h3>
                      <div className="toggle-row">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <IconGrid3x3 width={20} height={20} />
                          <span>Пороги урона</span>
                        </div>
                        <button
                          type="button"
                          className={cn(
                            "toggle-switch",
                            damageThresholds && "toggle-switch--active"
                          )}
                          onClick={() => setDamageThresholds((state) => !state)}
                          aria-pressed={damageThresholds}
                        >
                          <span
                            className={cn(
                              "toggle-switch__thumb",
                              damageThresholds && "toggle-switch__thumb--active"
                            )}
                          />
                        </button>
                      </div>
                      <div className="toggle-row">
                        <span>Рамка карты</span>
                        <button
                          type="button"
                          className={cn("toggle-switch", cardBorder && "toggle-switch--active")}
                          onClick={() => setCardBorder((state) => !state)}
                          aria-pressed={cardBorder}
                        >
                          <span
                            className={cn(
                              "toggle-switch__thumb",
                              cardBorder && "toggle-switch__thumb--active"
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    <Button className="export-button" onClick={handleExportPNG} disabled={isExporting}>
                      {isExporting ? "Экспортируем…" : "Экспорт PNG"}
                    </Button>
                    {exportError && <p className="export-error">{exportError}</p>}
                  </>
                ) : (
                  <div className="properties-empty">
                    <p>Выберите шаблон, чтобы редактировать и экспортировать карту.</p>
                  </div>
                )}
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
