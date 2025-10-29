import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { TargetedEvent } from "preact";
import {
  fetchTemplateCollection,
  type TemplateCard,
  type TemplateCollectionResponse,
  type TemplateGroup,
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

type TemplateGroupConfig = TemplateGroup & {
  filteredItems: TemplateCard[];
  expanded: boolean;
  toggle: () => void;
};

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
  const [ability1Title, setAbility1Title] = useState("");
  const [ability1Text, setAbility1Text] = useState("");
  const [ability2Title, setAbility2Title] = useState("");
  const [ability2Text, setAbility2Text] = useState("");
  const [customImage, setCustomImage] = useState<string | null>(null);

  const [damageThresholds, setDamageThresholds] = useState(false);
  const [showAsText, setShowAsText] = useState(false);
  const [cardBorder, setCardBorder] = useState(true);
  const [cutLines, setCutLines] = useState(false);
  const [gutters, setGutters] = useState(false);
  const [cardBack, setCardBack] = useState(false);
  const [cardEdges, setCardEdges] = useState<"square" | "rounded">("square");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const onInputChange = <Element extends HTMLInputElement | HTMLTextAreaElement>(
    setter: (value: string) => void
  ) => (event: TargetedEvent<Element, Event>) => {
    setter(event.currentTarget.value);
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
    setCardDescription(card.description ?? "");

    const [firstFeature, secondFeature] = card.features;
    setAbility1Title(firstFeature?.name ?? "");
    setAbility1Text(firstFeature?.text ?? "");
    setAbility2Title(secondFeature?.name ?? "");
    setAbility2Text(secondFeature?.text ?? "");

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

  const handleExportPNG = async () => {
    if (!cardRef.current) return;

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
              onChange={onInputChange<HTMLInputElement>(setSearchTerm)}
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
                    cardEdges === "rounded" && "card-canvas--rounded",
                    cardBorder && "card-canvas--bordered"
                  )}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    <div
                      className="card-canvas__dropzone"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {customImage ? (
                        <img src={customImage} alt="Пользовательское изображение" className="card-canvas__image" />
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
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: "12px",
                          marginBottom: "12px",
                        }}
                      >
                        <input
                          type="text"
                          value={cardTitle}
                          onChange={onInputChange<HTMLInputElement>(setCardTitle)}
                          style={{
                            fontSize: "1.875rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            flex: 1,
                          }}
                        />
                        <input
                          type="text"
                          value={cardType}
                          onChange={onInputChange<HTMLInputElement>(setCardType)}
                          className="card-canvas__type"
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <textarea
                          value={cardDescription}
                          onChange={onInputChange<HTMLTextAreaElement>(setCardDescription)}
                          rows={2}
                          style={{ fontStyle: "italic" }}
                        />

                        <div>
                          <input
                            type="text"
                            value={ability1Title}
                            onChange={onInputChange<HTMLInputElement>(setAbility1Title)}
                            style={{ fontWeight: 700, fontStyle: "italic", width: "auto" }}
                          />
                          <span>: </span>
                          <textarea
                            value={ability1Text}
                            onChange={onInputChange<HTMLTextAreaElement>(setAbility1Text)}
                            rows={3}
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            value={ability2Title}
                            onChange={onInputChange<HTMLInputElement>(setAbility2Title)}
                            style={{ fontWeight: 700, fontStyle: "italic", width: "auto" }}
                          />
                          <span>: </span>
                          <textarea
                            value={ability2Text}
                            onChange={onInputChange<HTMLTextAreaElement>(setAbility2Text)}
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <aside className="properties-panel">
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
                  <span>Показывать как текст</span>
                  <button
                    type="button"
                    className={cn("toggle-switch", showAsText && "toggle-switch--active")}
                    onClick={() => setShowAsText((state) => !state)}
                    aria-pressed={showAsText}
                  >
                    <span
                      className={cn(
                        "toggle-switch__thumb",
                        showAsText && "toggle-switch__thumb--active"
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

                <div className="properties-section">
                  <h3>Углы карты</h3>
                  <div className="edge-selector">
                    <button
                      type="button"
                      className={cn(cardEdges === "square" && "edge-selector__option--active")}
                      onClick={() => setCardEdges("square")}
                    >
                      Прямые
                    </button>
                    <button
                      type="button"
                      className={cn(cardEdges === "rounded" && "edge-selector__option--active")}
                      onClick={() => setCardEdges("rounded")}
                    >
                      Скруглённые
                    </button>
                  </div>
                </div>

                <div className="properties-section">
                  <div className="toggle-row">
                    <span>Линии резки</span>
                    <button
                      type="button"
                      className={cn("toggle-switch", cutLines && "toggle-switch--active")}
                      onClick={() => setCutLines((state) => !state)}
                      aria-pressed={cutLines}
                    >
                      <span
                        className={cn(
                          "toggle-switch__thumb",
                          cutLines && "toggle-switch__thumb--active"
                        )}
                      />
                    </button>
                  </div>
                  <div className="toggle-row">
                    <span>Поля</span>
                    <button
                      type="button"
                      className={cn("toggle-switch", gutters && "toggle-switch--active")}
                      onClick={() => setGutters((state) => !state)}
                      aria-pressed={gutters}
                    >
                      <span
                        className={cn(
                          "toggle-switch__thumb",
                          gutters && "toggle-switch__thumb--active"
                        )}
                      />
                    </button>
                  </div>
                  <div className="toggle-row">
                    <span>Оборот карты</span>
                    <button
                      type="button"
                      className={cn("toggle-switch", cardBack && "toggle-switch--active")}
                      onClick={() => setCardBack((state) => !state)}
                      aria-pressed={cardBack}
                    >
                      <span
                        className={cn(
                          "toggle-switch__thumb",
                          cardBack && "toggle-switch__thumb--active"
                        )}
                      />
                    </button>
                  </div>
                </div>

                <Button className="export-button" onClick={handleExportPNG}>
                  Экспорт PNG
                </Button>
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
