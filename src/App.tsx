import { useState, useRef } from "preact/hooks";
import type { TargetedEvent } from "preact";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  IconChevronRight,
  IconClose,
  IconGrid3x3,
  IconHelpCircle,
  IconRotateCw,
  IconSearch,
  IconUpload,
} from "@/components/icons";
import "./App.css";

const ancestryCards = [
  { id: 1, name: "Clank", image: "https://ext.same-assets.com/2698655591/974273112.webp", category: "ancestry" },
  { id: 2, name: "Drakana", image: "https://ext.same-assets.com/2698655591/2445136968.webp", category: "ancestry" },
  { id: 3, name: "Dwarf", image: "https://ext.same-assets.com/2698655591/2264066286.webp", category: "ancestry" },
  { id: 4, name: "Elf", image: "https://ext.same-assets.com/2698655591/2077389843.webp", category: "ancestry" },
  { id: 5, name: "Faerie", image: "https://ext.same-assets.com/2698655591/1406645107.webp", category: "ancestry" },
  { id: 6, name: "Faun", image: "https://ext.same-assets.com/2698655591/3482026081.webp", category: "ancestry" },
];

const classCards = [
  { id: 101, name: "Bard", image: "https://ext.same-assets.com/2698655591/974273112.webp", category: "class" },
  { id: 102, name: "Guardian", image: "https://ext.same-assets.com/2698655591/2445136968.webp", category: "class" },
  { id: 103, name: "Ranger", image: "https://ext.same-assets.com/2698655591/2264066286.webp", category: "class" },
  { id: 104, name: "Rogue", image: "https://ext.same-assets.com/2698655591/2077389843.webp", category: "class" },
  { id: 105, name: "Seraph", image: "https://ext.same-assets.com/2698655591/1406645107.webp", category: "class" },
  { id: 106, name: "Sorcerer", image: "https://ext.same-assets.com/2698655591/3482026081.webp", category: "class" },
];

const domainCards = [
  { id: 201, name: "Arcana", image: "https://ext.same-assets.com/2698655591/1571735549.webp", category: "domain" },
  { id: 202, name: "Blade", image: "https://ext.same-assets.com/2698655591/7716652.webp", category: "domain" },
  { id: 203, name: "Bone", image: "https://ext.same-assets.com/2698655591/3916009364.webp", category: "domain" },
  { id: 204, name: "Grace", image: "https://ext.same-assets.com/2698655591/1854087848.webp", category: "domain" },
  { id: 205, name: "Sage", image: "https://ext.same-assets.com/2698655591/3968401418.webp", category: "domain" },
  { id: 206, name: "Valor", image: "https://ext.same-assets.com/2698655591/1506275159.webp", category: "domain" },
];

const adversaryCards = [
  { id: 301, name: "Dragon", image: "https://ext.same-assets.com/2698655591/3324488874.webp", category: "adversary" },
  { id: 302, name: "Goblin Chief", image: "https://ext.same-assets.com/2698655591/1215511856.webp", category: "adversary" },
  { id: 303, name: "Undead Knight", image: "https://ext.same-assets.com/2698655591/659465483.webp", category: "adversary" },
  { id: 304, name: "Demon", image: "https://ext.same-assets.com/2698655591/22063292.webp", category: "adversary" },
];

const allCards = [...ancestryCards, ...classCards, ...domainCards, ...adversaryCards];

type CardTemplate = (typeof allCards)[number];

type TemplateGroupConfig = {
  title: string;
  items: CardTemplate[];
  expanded: boolean;
  toggle: () => void;
};

export default function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [ancestryExpanded, setAncestryExpanded] = useState(true);
  const [classExpanded, setClassExpanded] = useState(false);
  const [domainExpanded, setDomainExpanded] = useState(false);
  const [adversaryExpanded, setAdversaryExpanded] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardTemplate | null>(null);

  const [cardTitle, setCardTitle] = useState("");
  const [cardType, setCardType] = useState("ANCESTRY");
  const [cardDescription, setCardDescription] = useState(
    "Clanks are sentient mechanical beings built from a variety of materials, including metal, wood, and stone."
  );
  const [ability1Title, setAbility1Title] = useState("Purposeful Design");
  const [ability1Text, setAbility1Text] = useState(
    "Decide who made you and for what purpose. At character creation, choose one of your Experiences that best aligns with this purpose and gain a permanent +1 bonus to it."
  );
  const [ability2Title, setAbility2Title] = useState("Efficient");
  const [ability2Text, setAbility2Text] = useState(
    "When you take a short rest, you can choose a long rest move instead of a short rest move."
  );
  const [customImage, setCustomImage] = useState<string | null>(null);

  const [damageThresholds, setDamageThresholds] = useState(false);
  const [showAsText, setShowAsText] = useState(false);
  const [cardBorder, setCardBorder] = useState(true);
  const [artistName, setArtistName] = useState(true);
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

  const filteredAncestry = ancestryCards.filter((card) =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredClasses = classCards.filter((card) =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredDomains = domainCards.filter((card) =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredAdversaries = adversaryCards.filter((card) =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCardClick = (card: CardTemplate) => {
    setSelectedCard(card);
    setCardTitle(card.name);
    setCardType(card.category.toUpperCase());
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
    link.download = `${cardTitle.trim() || "card"}-card.png`;
    link.href = dataUrl;
    link.click();
  };

  const templateGroups: TemplateGroupConfig[] = [
    {
      title: "Ancestry",
      items: filteredAncestry,
      expanded: ancestryExpanded,
      toggle: () => setAncestryExpanded((state) => !state),
    },
    {
      title: "Classes",
      items: filteredClasses,
      expanded: classExpanded,
      toggle: () => setClassExpanded((state) => !state),
    },
    {
      title: "Domains",
      items: filteredDomains,
      expanded: domainExpanded,
      toggle: () => setDomainExpanded((state) => !state),
    },
    {
      title: "Adversaries",
      items: filteredAdversaries,
      expanded: adversaryExpanded,
      toggle: () => setAdversaryExpanded((state) => !state),
    },
  ];

  const renderTemplateGroup = ({ title, items, expanded, toggle }: TemplateGroupConfig) => (
    <div key={title} className="template-group">
      <button type="button" className="template-group__toggle" onClick={toggle}>
        <span className="template-group__title">{title}</span>
        <div className="template-group__meta">
          <span className="template-group__count">{items.length}</span>
          <span
            className={cn(
              "template-group__chevron",
              !expanded && "template-group__chevron--collapsed"
            )}
          >
            −
          </span>
        </div>
      </button>
      {expanded && (
        <div className="template-grid">
          {items.map((card) => (
            <div
              key={card.id}
              className="template-card"
              onClick={() => handleCardClick(card)}
            >
              <img src={card.image} alt={card.name} className="template-card__image" />
              <div className="template-card__label">{card.name}</div>
            </div>
          ))}
        </div>
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
              placeholder="Search templates..."
              value={searchTerm}
              onChange={onInputChange<HTMLInputElement>(setSearchTerm)}
              className="input--search"
            />
          </div>
        </div>

        <div className="sidebar__templates">
          <div className="sidebar__templates-header">
            <h2 className="template-group__title">Base Card Templates</h2>
            <Button variant="ghost" size="icon" aria-label="Shuffle templates">
              <IconRotateCw />
            </Button>
          </div>

          <div className="sidebar__scroll">
            {templateGroups.map(renderTemplateGroup)}
          </div>
        </div>

        <div className="sidebar__footer">
          <div>
            <span>Powered by </span>
            <a href="https://pixeltable.net" target="_blank" rel="noopener noreferrer">
              PixelTable
            </a>
          </div>
          <div className="sidebar__footer-actions">
            <Button variant="ghost" size="icon" aria-label="Mark as complete">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </Button>
            <Button variant="ghost" size="icon" aria-label="Help">
              <IconHelpCircle />
            </Button>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="workspace__header">
          <Button variant="ghost" size="icon" className="workspace__menu" aria-label="Menu">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </Button>
          <img
            src="https://ext.same-assets.com/2698655591/3435922477.png"
            alt="Daggerheart Logo"
            className="workspace__logo"
          />
          {selectedCard && (
            <div className="workspace__selection">
              <span className="workspace__selection-label">{cardTitle}</span>
              <Button variant="ghost" size="icon" aria-label="Close editor" onClick={handleCloseEditor}>
                <IconClose />
              </Button>
            </div>
          )}
        </header>

        <div
          className="workspace__body"
          style={{
            backgroundImage: "url('https://ext.same-assets.com/2698655591/2894399564.png')",
          }}
        >
          {selectedCard ? (
            <>
              <section className="editor-panel">
                <div className="editor-panel__headline">
                  <h1>{cardType}</h1>
                  <p className="editor-panel__timestamp">Last updated: Oct 29, 2025 1:33 pm</p>
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
                        <img src={customImage} alt="Custom" className="card-canvas__image" />
                      ) : (
                        <div>
                          <div className="card-canvas__upload-icon">
                            <IconUpload width={24} height={24} stroke="#374151" />
                          </div>
                          <p style={{ textAlign: "center", color: "#4b5563", fontSize: "0.875rem" }}>
                            Upload Custom Image
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

                      {artistName && (
                        <div className="card-canvas__footer">
                          <span style={{ fontStyle: "italic" }}>Artist Name</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span>Daggerheart™ Compatible. Terms at Daggerheart.com</span>
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <aside className="properties-panel">
                <div className="toggle-row">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <IconGrid3x3 width={20} height={20} stroke="hsl(var(--primary))" />
                    <h2 style={{ margin: 0, fontSize: "1rem" }}>Card Properties</h2>
                  </div>
                  <IconChevronRight stroke="hsl(var(--muted-foreground))" />
                </div>

                <div className="properties-section">
                  <h3>Header Image</h3>
                    <Button
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ backgroundColor: "#4a4b5f" }}
                    >
                      <IconUpload width={16} height={16} />
                      Upload
                  </Button>
                </div>

                <div className="properties-section">
                  <h3>Base Settings</h3>
                  <div className="toggle-row">
                    <span>Damage Thresholds</span>
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

                  {damageThresholds && (
                    <div className="toggle-row" style={{ paddingLeft: "16px" }}>
                      <span>Show as text</span>
                      <button
                        type="button"
                        className={cn(
                          "toggle-switch",
                          showAsText && "toggle-switch--active"
                        )}
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
                  )}

                  <div className="toggle-row">
                    <span>Card Border</span>
                    <button
                      type="button"
                      className={cn(
                        "toggle-switch",
                        cardBorder && "toggle-switch--active"
                      )}
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

                  <div className="toggle-row">
                    <span>Artist Name</span>
                    <button
                      type="button"
                      className={cn(
                        "toggle-switch",
                        artistName && "toggle-switch--active"
                      )}
                      onClick={() => setArtistName((state) => !state)}
                      aria-pressed={artistName}
                    >
                      <span
                        className={cn(
                          "toggle-switch__thumb",
                          artistName && "toggle-switch__thumb--active"
                        )}
                      />
                    </button>
                  </div>
                </div>

                <div className="properties-section">
                  <h3>Card Edges</h3>
                  <div className="edge-selector">
                    <button
                      type="button"
                      className={cn(cardEdges === "square" && "edge-selector__option--active")}
                      onClick={() => setCardEdges("square")}
                    >
                      Square
                    </button>
                    <button
                      type="button"
                      className={cn(cardEdges === "rounded" && "edge-selector__option--active")}
                      onClick={() => setCardEdges("rounded")}
                    >
                      Rounded
                    </button>
                  </div>
                </div>

                <div className="properties-section">
                  <div className="toggle-row">
                    <span>Cut Lines</span>
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
                    <span>Gutters</span>
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
                    <span>Card Back</span>
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
                  Export PNG
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
