import type { TemplateCard } from "@/lib/api";
import type { CardFields, CardTypeConfig, CardTypeId } from "@/lib/cardTypes";
import { CARD_TYPE_LIST } from "@/lib/cardTypes";
import type { TemplateFeature } from "@/lib/api";
import type { TargetedEvent } from "preact";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { JSX } from "preact";
import { normalizeFeatureName } from "@/lib/templateUtils";

type CardFieldInputFactory = <
  Element extends HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
>(
  field: keyof CardFields,
  transform?: (value: string) => string
) => (event: TargetedEvent<Element, Event>) => void;

interface PropertiesPanelProps {
  selectedCard: TemplateCard | null;
  cardFields: CardFields;
  typeConfig: CardTypeConfig;
  selectedTypeId: CardTypeId;
  onTypeChange: (event: TargetedEvent<HTMLSelectElement, Event>) => void;
  onFieldInput: CardFieldInputFactory;
  onSubclassFeatureChange: (event: TargetedEvent<HTMLSelectElement, Event>) => void;
  isSubclass: boolean;
  selectedFeatureIndex: number;
  features: TemplateFeature[];
  onExport: () => void;
  isExporting: boolean;
  exportError: string | null;
  stripMarkdownLinks: (value: string) => string;
}

export function PropertiesPanel({
  selectedCard,
  cardFields,
  typeConfig,
  selectedTypeId,
  onTypeChange,
  onFieldInput,
  onSubclassFeatureChange,
  isSubclass,
  selectedFeatureIndex,
  features,
  onExport,
  isExporting,
  exportError,
  stripMarkdownLinks,
}: PropertiesPanelProps) {
  const typeOptions = CARD_TYPE_LIST;

  const renderFeatureOptions = () => {
    if (!isSubclass || !selectedCard || features.length === 0) {
      return null;
    }

    return (
      <div className="properties-field">
        <label htmlFor="card-feature">Раздел</label>
        <select
          id="card-feature"
          className="card-feature-editor__select"
          value={String(selectedFeatureIndex)}
          onChange={onSubclassFeatureChange}
        >
          {features.map((feature, index) => (
            <option key={feature.id} value={index}>
              {feature.group
                ? `${feature.group} · ${normalizeFeatureName(feature)}`
                : normalizeFeatureName(feature)}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <aside className="properties-panel">
      <div className="properties-section">
        <h3>Тип карты</h3>
        <div className="properties-field">
          <label htmlFor="card-type">Категория</label>
          <select
            id="card-type"
            className="card-feature-editor__select"
            value={selectedTypeId}
            onChange={onTypeChange}
          >
            {typeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="properties-section properties-section--form">
        <h3>Основные поля</h3>
        <Field label="Заголовок">
          <Input
            id="card-title"
            value={cardFields.title}
            onInput={onFieldInput<HTMLInputElement>("title")}
          />
        </Field>
        <Field label="Подпись">
          <Input
            id="card-label"
            value={cardFields.label}
            placeholder={typeConfig.cardLabel}
            onInput={onFieldInput<HTMLInputElement>("label")}
          />
        </Field>
        <Field label="Источник">
          <Input
            id="card-source"
            value={cardFields.source}
            onInput={onFieldInput<HTMLInputElement>("source")}
          />
        </Field>
        <Field label="Автор">
          <Input
            id="card-attribution"
            value={cardFields.attribution}
            onInput={onFieldInput<HTMLInputElement>("attribution")}
          />
        </Field>
        <Field label="Прелюдия">
          <textarea
            id="card-prelude"
            className="properties-textarea"
            value={cardFields.prelude}
            onInput={onFieldInput<HTMLTextAreaElement>("prelude", stripMarkdownLinks)}
            rows={3}
          />
        </Field>
        <Field label="Описание">
          <textarea
            id="card-description"
            className="card-content-textarea"
            value={cardFields.description}
            onInput={onFieldInput<HTMLTextAreaElement>("description", stripMarkdownLinks)}
            rows={isSubclass ? 12 : 14}
          />
        </Field>
        {renderFeatureOptions()}
        {typeConfig.supportsTier && (
          <Field label="Уровень">
            <Input
              id="card-tier"
              value={cardFields.subclassTier}
              onInput={onFieldInput<HTMLInputElement>("subclassTier")}
            />
          </Field>
        )}
        {typeConfig.supportsSpellcast && (
          <Field label="Spellcast">
            <Input
              id="card-spellcast"
              value={cardFields.spellcast}
              onInput={onFieldInput<HTMLInputElement>("spellcast", stripMarkdownLinks)}
            />
          </Field>
        )}
      </div>

      <div className="properties-section">
        <h3>Медиа</h3>
        <Field label="Разделитель">
          <Input
            id="card-divider"
            value={cardFields.dividerImage}
            placeholder={typeConfig.defaultDivider}
            onInput={onFieldInput<HTMLInputElement>("dividerImage")}
          />
        </Field>
        {typeConfig.supportsBanner && (
          <>
            <Field label="Баннер">
              <Input
                id="card-banner-image"
                value={cardFields.bannerImage}
                onInput={onFieldInput<HTMLInputElement>("bannerImage")}
              />
            </Field>
            <Field label="Текст баннера">
              <Input
                id="card-banner-text"
                value={cardFields.bannerText}
                onInput={onFieldInput<HTMLInputElement>("bannerText")}
              />
            </Field>
          </>
        )}
        {typeConfig.supportsStress && (
          <>
            <Field label="Иконка стресса">
              <Input
                id="card-stress-image"
                value={cardFields.stressImage}
                onInput={onFieldInput<HTMLInputElement>("stressImage")}
              />
            </Field>
            <Field label="Стоимость">
              <Input
                id="card-stress-text"
                value={cardFields.stressText}
                onInput={onFieldInput<HTMLInputElement>("stressText")}
              />
            </Field>
          </>
        )}
      </div>

      <Button className="export-button" onClick={onExport} disabled={isExporting}>
        {isExporting ? "Экспортируем…" : "Экспорт PNG"}
      </Button>
      {exportError && <p className="export-error">{exportError}</p>}
    </aside>
  );
}

interface FieldProps {
  label: string;
  children: JSX.Element;
}

function Field({ label, children }: FieldProps) {
  return (
    <div className="properties-field">
      <label>{label}</label>
      {children}
    </div>
  );
}
