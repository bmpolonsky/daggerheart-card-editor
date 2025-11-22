import { useMemo, useRef } from "preact/hooks";
import type { JSX } from "preact";
import { Button } from "@/components/ui/button";
import { IconClose } from "@/components/icons";
import { CardWorkspace } from "@/components/workspace/CardWorkspace";
import { useStore } from "@/lib/store";
import { templatesStore } from "@/stores/templates";
import { editorStore } from "@/stores/editor";
import { exportStore } from "@/stores/export";
import { CARD_TYPE_CONFIG, type CardFields, type CardTypeId } from "@/lib/cardTypes";
import { renderMarkdown } from "@/lib/markdown";
import { stripMarkdownLinks } from "@/lib/templateUtils";
import { editorService } from "@/services/editorService";
import { exportService } from "@/services/exportService";

type CardFieldInputFactory = <
  Element extends HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
>(
  field: keyof CardFields,
  transform?: (value: string) => string
) => (event: JSX.TargetedEvent<Element, Event>) => void;

export function WorkspaceContainer() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const { lastFetchedAt } = useStore(templatesStore);
  const { selectedCard, selectedTypeId, cardFields, customImage, selectedFeatureIndex } = useStore(editorStore);
  const { isExporting, exportError } = useStore(exportStore);

  const handleCloseEditor = () => {
    editorService.closeEditor();
  };

  const handleImageUpload = (event: JSX.TargetedEvent<HTMLInputElement, Event>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    void editorService.loadImageFromFile(file);
  };

  const onCardFieldInput: CardFieldInputFactory = (field, transform) => (event) => {
    const value = event.currentTarget.value;
    editorService.setField(field, value, transform);
  };

  const handleSubclassFeatureChange = (event: JSX.TargetedEvent<HTMLSelectElement, Event>) => {
    const index = Number(event.currentTarget.value);
    editorService.setSubclassFeature(index);
  };

  const handleTypeChange = (event: JSX.TargetedEvent<HTMLSelectElement, Event>) => {
    const nextType = event.currentTarget.value as CardTypeId;
    editorService.setCardType(nextType);
  };

  const handleExportPNG = async () => {
    if (!cardRef.current) return;
    await exportService.exportCurrentCard(cardRef.current);
  };

  const handleRequestImageUpload = () => {
    fileInputRef.current?.click();
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

  const typeConfig = CARD_TYPE_CONFIG[selectedTypeId];
  const cardImage = customImage ?? selectedCard?.image ?? null;
  const isSubclass = selectedTypeId === "subclass";
  const preludeHtml = useMemo(() => renderMarkdown(cardFields.prelude), [cardFields.prelude]);
  const descriptionHtml = useMemo(
    () => renderMarkdown(cardFields.description),
    [cardFields.description]
  );
  const spellcastHtml = useMemo(() => {
    const html = renderMarkdown(cardFields.spellcast);
    return html.replace(/^<p>/, "").replace(/<\/p>$/, "");
  }, [cardFields.spellcast]);
  const cardLabel = cardFields.label || typeConfig.cardLabel;
  const selectedFeatures = selectedCard?.features ?? [];

  return (
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
            <span className="workspace__selection-label">{cardFields.title || "Без названия"}</span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Закрыть редактор"
              onClick={handleCloseEditor}
            >
              <IconClose />
            </Button>
          </div>
        )}
      </header>

      <div className="workspace__body">
        {selectedCard ? (
          <CardWorkspace
            cardRef={cardRef}
            fileInputRef={fileInputRef}
            cardFields={cardFields}
            typeConfig={typeConfig}
            selectedTypeId={selectedTypeId}
            headlineTitle={typeConfig.name}
            lastUpdatedLabel={lastUpdatedLabel}
            cardLabel={cardLabel}
            cardImage={cardImage}
            customImage={customImage}
            selectedCard={selectedCard}
            isSubclass={isSubclass}
            selectedFeatureIndex={selectedFeatureIndex}
            features={selectedFeatures}
            onTypeChange={handleTypeChange}
            onFieldInput={onCardFieldInput}
            onSubclassFeatureChange={handleSubclassFeatureChange}
            onImageUpload={handleImageUpload}
          onRequestImageUpload={handleRequestImageUpload}
          onRequestImageUploadFromPanel={handleRequestImageUpload}
          preludeHtml={preludeHtml}
          descriptionHtml={descriptionHtml}
          spellcastHtml={spellcastHtml}
          onExport={handleExportPNG}
            isExporting={isExporting}
            exportError={exportError}
            stripMarkdownLinks={stripMarkdownLinks}
          />
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
            <p>Нажмите на любую карточку, чтобы открыть рабочее пространство и начать редактировать.</p>
          </section>
        )}
      </div>
    </main>
  );
}
