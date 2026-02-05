import type { TemplateCard } from "@/lib/api";
import {
  CARD_TYPE_CONFIG,
  DEFAULT_CARD_TYPE_ID,
  type CardFields,
  type CardTypeId,
  createEmptyCardFields,
} from "@/lib/cardTypes";
import { buildCardFieldsFromTemplate } from "@/lib/cardBuilder";
import { stripMarkdownLinks } from "@/lib/templateUtils";
import { editorStore } from "@/stores/editor";
import { exportStore } from "@/stores/export";
import { prefetchImages } from "@/lib/assetPrefetcher";
import { buildClassBanner, buildClassDivider, buildDomainBanner, buildDomainDivider } from "@/lib/domainAssets";
import { domainService } from "@/services/domainService";
import { domainStore } from "@/stores/domains";

type FieldTransformer = (value: string) => string;

export class EditorService {
  readonly store = editorStore;

  constructor() {
    domainStore.subscribe(() => {
      this.refreshDomainAssets();
    });
  }

  selectCard(card: TemplateCard) {
    const { cardFields, typeId, selectedFeatureIndex } = buildCardFieldsFromTemplate(card);
    const nextFields = this.applyDomainAssets(cardFields, typeId);

    this.prefetchAssets(nextFields, card.image);

    editorStore.update(() => ({
      selectedCard: card,
      selectedTypeId: typeId,
      cardFields: nextFields,
      customImage: null,
      selectedFeatureIndex,
    }));

    exportStore.update(() => ({
      isExporting: false,
      exportError: null,
    }));
  }

  closeEditor() {
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
  }

  setCardType(nextType: CardTypeId) {
    editorStore.update((prev) => {
      const nextConfig = CARD_TYPE_CONFIG[nextType];
      const nextFields = {
        ...prev,
        selectedTypeId: nextType,
        cardFields: {
          ...prev.cardFields,
          label: prev.cardFields.label || nextConfig.cardLabel,
          dividerImage: prev.cardFields.dividerImage || nextConfig.defaultDivider || "",
        },
      };

      return {
        ...nextFields,
        cardFields: this.applyDomainAssets(nextFields.cardFields, nextType),
      };
    });
  }

  setField(field: keyof CardFields, value: string, transform?: FieldTransformer) {
    editorStore.update((prev) => {
      const nextFields = {
        ...prev.cardFields,
        [field]: transform ? transform(value) : value,
      } as CardFields;

      return {
        ...prev,
        cardFields: this.applyDomainAssets(nextFields, prev.selectedTypeId),
      };
    });
  }

  setDomainPrimary(value: string) {
    this.setField("domainPrimary", value);
  }

  setDomainSecondary(value: string) {
    this.setField("domainSecondary", value);
  }

  refreshDomainAssets() {
    editorStore.update((prev) => ({
      ...prev,
      cardFields: this.applyDomainAssets(prev.cardFields, prev.selectedTypeId),
    }));
  }

  setSubclassFeature(index: number) {
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
  }

  setCustomImage(dataUrl: string | null) {
    editorStore.update((prev) => ({
      ...prev,
      customImage: dataUrl,
    }));
  }

  async loadImageFromFile(file: File) {
    const result = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    this.setCustomImage(result);
  }

  private prefetchAssets(cardFields: CardFields, cardImage: string | null) {
    prefetchImages([
      cardFields.dividerImage,
      cardFields.bannerImage,
      cardFields.stressImage,
      cardImage,
    ]);
  }

  private applyDomainAssets(cardFields: CardFields, typeId: CardTypeId): CardFields {
    if (typeId !== "domain-card" && typeId !== "subclass") {
      return cardFields;
    }

    const primaryId = cardFields.domainPrimary || cardFields.dataDomain;
    const secondaryId = cardFields.domainSecondary || primaryId;
    const primaryTheme = domainService.getTheme(primaryId) ?? {
      id: primaryId || "",
      name: primaryId || "",
      color: "#6b7280",
      icon: null,
      source: "custom" as const,
    };
    const secondaryTheme = domainService.getTheme(secondaryId) ?? primaryTheme;

    const bannerImage =
      typeId === "domain-card"
        ? buildDomainBanner(primaryTheme)
        : buildClassBanner(primaryTheme, secondaryTheme);
    const dividerImage =
      typeId === "domain-card"
        ? buildDomainDivider(primaryTheme)
        : buildClassDivider(primaryTheme, secondaryTheme);

    const classSet = new Set(cardFields.customClasses.split(" ").filter(Boolean));
    if (typeId === "domain-card") {
      if (primaryTheme.id) classSet.add(primaryTheme.id);
      if (secondaryTheme.id) classSet.add(secondaryTheme.id);
    }

    return {
      ...cardFields,
      bannerImage,
      dividerImage,
      dataDomain: typeId === "domain-card" ? primaryTheme.id : cardFields.dataDomain,
      customClasses: Array.from(classSet).join(" "),
    };
  }
}

export const editorService = new EditorService();
