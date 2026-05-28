import localforage from "localforage";

export interface Trade {
  id: string;
  date: string;
  asset: string;
  direction: "Long" | "Short";
  lotSize: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  rr: number;
  notes: string;
  screenshotId?: string;
  isWin: boolean;
  createdAt: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

const tradesStore = localforage.createInstance({ name: "trading-journal", storeName: "trades" });
const screenshotsStore = localforage.createInstance({ name: "trading-journal", storeName: "screenshots" });
const checklistStore = localforage.createInstance({ name: "trading-journal", storeName: "checklist" });

// Trades
export async function getTrades(): Promise<Trade[]> {
  const trades: Trade[] = [];
  await tradesStore.iterate<Trade, void>((val) => { trades.push(val); });
  return trades.sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveTrade(trade: Trade): Promise<void> {
  await tradesStore.setItem(trade.id, trade);
}

export async function deleteTrade(id: string): Promise<void> {
  await tradesStore.removeItem(id);
}

// Screenshots
export async function saveScreenshot(id: string, dataUrl: string): Promise<void> {
  await screenshotsStore.setItem(id, dataUrl);
}

export async function getScreenshot(id: string): Promise<string | null> {
  return screenshotsStore.getItem<string>(id);
}

export async function deleteScreenshot(id: string): Promise<void> {
  await screenshotsStore.removeItem(id);
}

// Checklist
export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: "news", label: "Checked High-Impact News Events", checked: false },
  { id: "risk", label: "Risk under 1% per trade", checked: false },
  { id: "session", label: "Trading within session hours", checked: false },
  { id: "confluences", label: "All confluences met (structure, OB, liquidity)", checked: false },
  { id: "bias", label: "Daily bias confirmed", checked: false },
  { id: "sl", label: "Stop loss placed before entry", checked: false },
  { id: "journal", label: "Previous trade reviewed", checked: false },
];

export async function getChecklist(): Promise<{ items: ChecklistItem[]; date: string } | null> {
  return checklistStore.getItem("checklist");
}

export async function saveChecklist(items: ChecklistItem[], date: string): Promise<void> {
  await checklistStore.setItem("checklist", { items, date });
}
