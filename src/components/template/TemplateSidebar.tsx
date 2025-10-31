import type { TemplateCard, TemplateGroup } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconRotateCw, IconSearch } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { TargetedEvent } from "preact";

export interface TemplateGroupView extends TemplateGroup {
  filteredItems: TemplateCard[];
  expanded: boolean;
  toggle: () => void;
}

interface TemplateSidebarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  error: string | null;
  groups: TemplateGroupView[];
  onReload: () => void;
  onSelectCard: (card: TemplateCard) => void;
}

export function TemplateSidebar({
  searchTerm,
  onSearchChange,
  isLoading,
  error,
  groups,
  onReload,
  onSelectCard,
}: TemplateSidebarProps) {
  const handleSearchInput = (event: TargetedEvent<HTMLInputElement, Event>) => {
    onSearchChange(event.currentTarget.value);
  };

  const renderTemplateGroup = (group: TemplateGroupView) => (
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
              onClick={() => onSelectCard(card)}
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
    <aside className="sidebar">
      <div className="sidebar__search">
        <div className="sidebar__search-field">
          <IconSearch className="sidebar__search-icon" />
          <Input
            type="text"
            placeholder="Поиск по шаблонам..."
            value={searchTerm}
            onInput={handleSearchInput}
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
            onClick={onReload}
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
          {groups.map(renderTemplateGroup)}
        </div>
      </div>
    </aside>
  );
}
