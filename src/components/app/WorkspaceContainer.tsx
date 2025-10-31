import { useCallback, useMemo, useRef } from "preact/hooks";
import type { JSX } from "preact";
import { Button } from "@/components/ui/button";
import { IconClose } from "@/components/icons";
import { CardWorkspace } from "@/components/workspace/CardWorkspace";
import { useStore } from "@/lib/store";
import { templatesStore } from "@/stores/templates";
import { editorStore } from "@/stores/editor";
import { exportStore } from "@/stores/export";
import {
  CARD_TYPE_CONFIG,
  DEFAULT_CARD_TYPE_ID,
  createEmptyCardFields,
  type CardFields,
  type CardTypeId,
} from "@/lib/cardTypes";
import { renderMarkdown } from "@/lib/markdown";
import { stripMarkdownLinks } from "@/lib/templateUtils";
import { inlineExternalImages } from "@/lib/exportUtils";

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
  const { selectedCard, selectedTypeId, cardFields, customImage, selectedFeatureIndex } =
    useStore(editorStore);
  const { isExporting, exportError } = useStore(exportStore);

  const handleCloseEditor = useCallback(() => {
    editorStore.update(() => ({
      selectedCard: null,
      selectedTypeId: DEFAULT_CARD_TYPE_ID,
      cardFields: createEmptyCardFields(),
      customImage: null,
      selectedFeatureIndex: 0,
    }));

    exportStore.update(() => ({
      isExporting: false,
      exportError: null,
    }));
  }, []);

  const handleImageUpload = useCallback((event: JSX.TargetedEvent<HTMLInputElement, Event>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      editorStore.update((prev) => ({
        ...prev,
        customImage: result,
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  const onCardFieldInput: CardFieldInputFactory = useCallback(
    (field, transform) => (event) => {
      const value = event.currentTarget.value;
      editorStore.update((prev) => ({
        ...prev,
        cardFields: {
          ...prev.cardFields,
          [field]: transform ? transform(value) : value,
        },
      }));
    },
    []
  );

  const handleSubclassFeatureChange = useCallback(
    (event: JSX.TargetedEvent<HTMLSelectElement, Event>) => {
      const index = Number(event.currentTarget.value);
      editorStore.update((prev) => {
        const feature = prev.selectedCard?.features[index];
        return {
          ...prev,
          selectedFeatureIndex: index,
          cardFields: {
            ...prev.cardFields,
            description: stripMarkdownLinks(feature?.text ?? ""),
            subclassTier: feature?.group ?? prev.cardFields.subclassTier,
          },
        };
      });
    },
    []
  );

  const handleTypeChange = useCallback((event: JSX.TargetedEvent<HTMLSelectElement, Event>) => {
    const nextType = event.currentTarget.value as CardTypeId;
    editorStore.update((prev) => {
      const nextConfig = CARD_TYPE_CONFIG[nextType];
      return {
        ...prev,
        selectedTypeId: nextType,
        cardFields: {
          ...prev.cardFields,
          label: prev.cardFields.label || nextConfig.cardLabel,
          dividerImage: prev.cardFields.dividerImage || nextConfig.defaultDivider || "",
        },
      };
    });
  }, []);

  const handleExportPNG = useCallback(async () => {
    if (!cardRef.current) return;

    exportStore.update((state) => ({
      ...state,
      exportError: null,
      isExporting: true,
    }));

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
      const currentFields = editorStore.getState().cardFields;
      const safeTitle = currentFields.title.trim() || "карта";
      link.download = `${safeTitle}-карта.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("PNG export failed", err);
      exportStore.update((state) => ({
        ...state,
        exportError: "Не удалось экспортировать PNG. Попробуйте ещё раз.",
      }));
    } finally {
      restoreImages?.();
      exportStore.update((state) => ({
        ...state,
        isExporting: false,
      }));
    }
  }, []);

  const handleRequestImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

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
