import type { CustomCardRecord } from "@/services/customCardsService";
import { Store } from "@/lib/store";

export interface CustomCardsState {
  items: CustomCardRecord[];
  lastUpdatedAt: number | null;
}

export const customCardsStore = new Store<CustomCardsState>({
  items: [],
  lastUpdatedAt: null,
});
