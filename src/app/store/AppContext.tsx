import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import {
  Trade,
  ChecklistItem,
  getTrades,
  saveTrade,
  deleteTrade,
  saveScreenshot,
  deleteScreenshot,
  getChecklist,
  saveChecklist,
  DEFAULT_CHECKLIST,
} from "./db";

interface AppState {
  trades: Trade[];
  checklist: ChecklistItem[];
  checklistDate: string;
  loading: boolean;
}

type Action =
  | { type: "SET_TRADES"; payload: Trade[] }
  | { type: "ADD_TRADE"; payload: Trade }
  | { type: "DELETE_TRADE"; payload: string }
  | { type: "SET_CHECKLIST"; payload: { items: ChecklistItem[]; date: string } }
  | { type: "TOGGLE_CHECKLIST_ITEM"; payload: string }
  | { type: "RESET_CHECKLIST" }
  | { type: "ADD_CHECKLIST_ITEM"; payload: { id: string; label: string } }
  | { type: "DELETE_CHECKLIST_ITEM"; payload: string }
  | { type: "SET_LOADING"; payload: boolean };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_TRADES":
      return { ...state, trades: action.payload };
    case "ADD_TRADE":
      return { ...state, trades: [action.payload, ...state.trades] };
    case "DELETE_TRADE":
      return { ...state, trades: state.trades.filter((t) => t.id !== action.payload) };
    case "SET_CHECKLIST":
      return { ...state, checklist: action.payload.items, checklistDate: action.payload.date };
    case "TOGGLE_CHECKLIST_ITEM":
      return {
        ...state,
        checklist: state.checklist.map((item) =>
          item.id === action.payload ? { ...item, checked: !item.checked } : item
        ),
      };
    case "RESET_CHECKLIST":
      return { ...state, checklist: state.checklist.map((item) => ({ ...item, checked: false })) };
    case "ADD_CHECKLIST_ITEM":
      return {
        ...state,
        checklist: [
          ...state.checklist,
          { id: action.payload.id, label: action.payload.label, checked: false },
        ],
      };
    case "DELETE_CHECKLIST_ITEM":
      return {
        ...state,
        checklist: state.checklist.filter((item) => item.id !== action.payload),
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

const today = () => new Date().toISOString().split("T")[0];

interface AppContextValue {
  state: AppState;
  addTrade: (trade: Omit<Trade, "id" | "createdAt">, screenshot?: string) => Promise<void>;
  removeTrade: (id: string, screenshotId?: string) => Promise<void>;
  toggleChecklistItem: (id: string) => void;
  resetChecklist: () => void;
  addChecklistItem: (label: string) => void;
  deleteChecklistItem: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    trades: [],
    checklist: DEFAULT_CHECKLIST,
    checklistDate: today(),
    loading: true,
  });

  useEffect(() => {
    async function load() {
      const [trades, checklistData] = await Promise.all([getTrades(), getChecklist()]);
      dispatch({ type: "SET_TRADES", payload: trades });

      const todayStr = today();
      if (checklistData && checklistData.date === todayStr) {
        dispatch({ type: "SET_CHECKLIST", payload: checklistData });
      } else {
        dispatch({ type: "SET_CHECKLIST", payload: { items: DEFAULT_CHECKLIST, date: todayStr } });
      }
      dispatch({ type: "SET_LOADING", payload: false });
    }
    load();
  }, []);

  // Because of your architecture, saving to DB happens here dynamically whenever the checklist changes
  useEffect(() => {
    if (!state.loading) {
      saveChecklist(state.checklist, state.checklistDate);
    }
  }, [state.checklist, state.checklistDate, state.loading]);

  const addTrade = useCallback(async (tradeData: Omit<Trade, "id" | "createdAt">, screenshot?: string) => {
    const id = crypto.randomUUID();
    const screenshotId = screenshot ? `screenshot-${id}` : undefined;
    const trade: Trade = { ...tradeData, id, screenshotId, createdAt: Date.now() };
    if (screenshot && screenshotId) {
      await saveScreenshot(screenshotId, screenshot);
    }
    await saveTrade(trade);
    dispatch({ type: "ADD_TRADE", payload: trade });
  }, []);

  const removeTrade = useCallback(async (id: string, screenshotId?: string) => {
    await deleteTrade(id);
    if (screenshotId) await deleteScreenshot(screenshotId);
    dispatch({ type: "DELETE_TRADE", payload: id });
  }, []);

  const toggleChecklistItem = useCallback((id: string) => {
    dispatch({ type: "TOGGLE_CHECKLIST_ITEM", payload: id });
  }, []);

  const resetChecklist = useCallback(() => {
    dispatch({ type: "RESET_CHECKLIST" });
  }, []);

  const addChecklistItem = useCallback((label: string) => {
    // using crypto.randomUUID() to match your addTrade pattern
    dispatch({
      type: "ADD_CHECKLIST_ITEM",
      payload: { id: crypto.randomUUID(), label },
    });
  }, []);

  const deleteChecklistItem = useCallback((id: string) => {
    dispatch({ type: "DELETE_CHECKLIST_ITEM", payload: id });
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        addTrade,
        removeTrade,
        toggleChecklistItem,
        resetChecklist,
        addChecklistItem,
        deleteChecklistItem,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}