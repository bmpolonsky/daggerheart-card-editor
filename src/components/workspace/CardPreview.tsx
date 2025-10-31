import type { RefObject } from "preact";
import type { TemplateCard } from "@/lib/api";
import type { CardFields, CardTypeConfig } from "@/lib/cardTypes";
import { IconUpload } from "@/components/icons";
import type { TargetedEvent } from "preact";

interface CardPreviewProps {
  cardRef: RefObject<HTMLDivElement>;
  fileInputRef: RefObject<HTMLInputElement>;
  cardFields: CardFields;
  typeConfig: CardTypeConfig;
  cardLabel: string;
  cardImage: string | null;
  customImage: string | null;
  selectedCard: TemplateCard | null;
  onImageUpload: (event: TargetedEvent<HTMLInputElement, Event>) => void;
  onRequestImageUpload: () => void;
  preludeHtml: string;
  descriptionHtml: string;
  spellcastHtml: string;
}

export function CardPreview({
  cardRef,
  fileInputRef,
  cardFields,
  typeConfig,
  cardLabel,
  cardImage,
  customImage,
  selectedCard,
  onImageUpload,
  onRequestImageUpload,
  preludeHtml,
  descriptionHtml,
  spellcastHtml,
}: CardPreviewProps) {
  return (
    <div className="card-preview card-preview-scope">
      <div className="card_holder print">
        <div
          ref={cardRef}
          id={cardFields.slug || undefined}
          className={[
            "card",
            ...typeConfig.baseClasses,
            cardFields.customClasses && cardFields.customClasses,
          ]
            .filter(Boolean)
            .join(" ")}
          {...(cardFields.dataSource && { "data-source": cardFields.dataSource })}
          {...(typeConfig.supportsDataClass && cardFields.dataClass && {
            "data-class": cardFields.dataClass,
          })}
          {...(typeConfig.supportsTier && cardFields.subclassTier && {
            "data-subclass-tier": cardFields.subclassTier,
          })}
          {...(typeConfig.supportsDataDomain && cardFields.dataDomain && {
            "data-domain": cardFields.dataDomain,
          })}
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
            onClick={onRequestImageUpload}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onRequestImageUpload();
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
                  <p className="spellcast" dangerouslySetInnerHTML={{ __html: spellcastHtml }} />
                )}
                {cardFields.prelude.trim() && (
                  <div className="prelude" dangerouslySetInnerHTML={{ __html: preludeHtml }} />
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onImageUpload}
        hidden
      />
    </div>
  );
}
