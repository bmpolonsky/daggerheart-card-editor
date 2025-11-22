import type { RefObject } from "preact";
import type { TemplateCard, TemplateFeature } from "@/lib/api";
import type { CardFields, CardTypeConfig, CardTypeId } from "@/lib/cardTypes";
import type { TargetedEvent } from "preact";
import { CardPreview } from "@/components/workspace/CardPreview";
import { PropertiesPanel } from "@/components/workspace/PropertiesPanel";

type CardFieldInputFactory = <
  Element extends HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
>(
  field: keyof CardFields,
  transform?: (value: string) => string
) => (event: TargetedEvent<Element, Event>) => void;

interface CardWorkspaceProps {
  cardRef: RefObject<HTMLDivElement>;
  fileInputRef: RefObject<HTMLInputElement>;
  cardFields: CardFields;
  typeConfig: CardTypeConfig;
  selectedTypeId: CardTypeId;
  headlineTitle: string;
  lastUpdatedLabel: string | null;
  cardLabel: string;
  cardImage: string | null;
  customImage: string | null;
  selectedCard: TemplateCard | null;
  isSubclass: boolean;
  selectedFeatureIndex: number;
  features: TemplateFeature[];
  onTypeChange: (event: TargetedEvent<HTMLSelectElement, Event>) => void;
  onFieldInput: CardFieldInputFactory;
  onSubclassFeatureChange: (event: TargetedEvent<HTMLSelectElement, Event>) => void;
  onImageUpload: (event: TargetedEvent<HTMLInputElement, Event>) => void;
  onRequestImageUpload: () => void;
  preludeHtml: string;
  descriptionHtml: string;
  spellcastHtml: string;
  onExport: () => void;
  isExporting: boolean;
  exportError: string | null;
  stripMarkdownLinks: (value: string) => string;
  onRequestImageUploadFromPanel: () => void;
}

export function CardWorkspace({
  cardRef,
  fileInputRef,
  cardFields,
  typeConfig,
  selectedTypeId,
  headlineTitle,
  lastUpdatedLabel,
  cardLabel,
  cardImage,
  customImage,
  selectedCard,
  isSubclass,
  selectedFeatureIndex,
  features,
  onTypeChange,
  onFieldInput,
  onSubclassFeatureChange,
  onImageUpload,
  onRequestImageUpload,
  onRequestImageUploadFromPanel,
  preludeHtml,
  descriptionHtml,
  spellcastHtml,
  onExport,
  isExporting,
  exportError,
  stripMarkdownLinks,
}: CardWorkspaceProps) {
  return (
    <>
      <section className="editor-panel">
        <div className="editor-panel__headline">
          <h1>{headlineTitle}</h1>
          <p className="editor-panel__timestamp">
            Последнее обновление: {lastUpdatedLabel ?? "—"}
          </p>
        </div>
        <div className="card-preview-wrapper">
          <CardPreview
            cardRef={cardRef}
            fileInputRef={fileInputRef}
            cardFields={cardFields}
            typeConfig={typeConfig}
            cardLabel={cardLabel}
            cardImage={cardImage}
            customImage={customImage}
            selectedCard={selectedCard}
            onImageUpload={onImageUpload}
            onRequestImageUpload={onRequestImageUpload}
            preludeHtml={preludeHtml}
            descriptionHtml={descriptionHtml}
            spellcastHtml={spellcastHtml}
          />
        </div>
      </section>

      <PropertiesPanel
        selectedCard={selectedCard}
        cardFields={cardFields}
        typeConfig={typeConfig}
        selectedTypeId={selectedTypeId}
        onTypeChange={onTypeChange}
        onFieldInput={onFieldInput}
        onSubclassFeatureChange={onSubclassFeatureChange}
        isSubclass={isSubclass}
        selectedFeatureIndex={selectedFeatureIndex}
        features={features}
        onExport={onExport}
        isExporting={isExporting}
        exportError={exportError}
        stripMarkdownLinks={stripMarkdownLinks}
        onRequestImageUpload={onRequestImageUploadFromPanel}
      />
    </>
  );
}
