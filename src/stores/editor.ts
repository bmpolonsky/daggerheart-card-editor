import type { TemplateCard } from "@/lib/api";
import {
  DEFAULT_CARD_TYPE_ID,
  type CardFields,
  type CardTypeId,
  createEmptyCardFields,
} from "@/lib/cardTypes";
import { Store } from "@/lib/store";

export interface EditorState {
  selectedCard: TemplateCard | null;
  selectedTypeId: CardTypeId;
  cardFields: CardFields;
  customImage: string | null;
  selectedFeatureIndex: number;
}

const initialState: EditorState = {
  selectedCard: null,
  selectedTypeId: DEFAULT_CARD_TYPE_ID,
  cardFields: createEmptyCardFields(),
  customImage: null,
  selectedFeatureIndex: 0,
};

export const editorStore = new Store<EditorState>(initialState);
