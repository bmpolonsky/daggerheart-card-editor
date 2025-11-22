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

type FieldTransformer = (value: string) => string;

export class EditorService {
  readonly store = editorStore;

  selectCard(card: TemplateCard) {
    const { cardFields, typeId, selectedFeatureIndex } = buildCardFieldsFromTemplate(card);

    this.prefetchAssets(cardFields, card.image);

    editorStore.update(() => ({
      selectedCard: card,
      selectedTypeId: typeId,
      cardFields,
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
  }

  setField(field: keyof CardFields, value: string, transform?: FieldTransformer) {
    editorStore.update((prev) => ({
      ...prev,
      cardFields: {
        ...prev.cardFields,
        [field]: transform ? transform(value) : value,
      },
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
}

export const editorService = new EditorService();
