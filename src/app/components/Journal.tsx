import { useState, useMemo } from "react";
import { Plus, Search, Filter, BookOpen } from "lucide-react";
import { useAppContext } from "../store/AppContext";
import { TradeCard } from "./TradeCard";
import { LogTradeForm } from "./LogTradeForm";

type FilterType = "all" | "win" | "loss";

export function Journal() {
  const { state } = useAppContext();
  const { trades } = state;
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = useMemo(() => {
    return trades.filter((t) => {
      const matchSearch =
        !search ||
        t.asset.toLowerCase().includes(search.toLowerCase()) ||
        t.notes.toLowerCase().includes(search.toLowerCase()) ||
        t.date.includes(search);
      const matchFilter =
        filter === "all" || (filter === "win" && t.isWin) || (filter === "loss" && !t.isWin);
      return matchSearch && matchFilter;
    });
  }, [trades, search, filter]);

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white">Trade Journal</h2>
            <p className="text-[#8b8fa8] text-sm">{trades.length} total trades</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2 text-sm transition-colors"
          >
            <Plus size={16} />
            Log Trade
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8fa8]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by asset, date, notes..."
              className="w-full bg-[#1a1d23] border border-[#2a2d35] rounded-xl pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="flex bg-[#1a1d23] border border-[#2a2d35] rounded-xl overflow-hidden text-sm">
            {(["all", "win", "loss"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 capitalize transition-colors ${
                  filter === f
                    ? f === "win"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : f === "loss"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-indigo-500/20 text-indigo-400"
                    : "text-[#8b8fa8] hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Trade List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 gap-3 text-center">
            <BookOpen size={40} className="text-[#2a2d35]" />
            <div>
              <p className="text-[#8b8fa8]">
                {trades.length === 0 ? "No trades logged yet." : "No trades match your filter."}
              </p>
              {trades.length === 0 && (
                <p className="text-[#8b8fa8] text-sm mt-1">
                  Tap{" "}
                  <button onClick={() => setShowForm(true)} className="text-indigo-400 underline">
                    Log Trade
                  </button>{" "}
                  to get started.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((trade) => (
              <TradeCard key={trade.id} trade={trade} />
            ))}
          </div>
        )}
      </div>

      {showForm && <LogTradeForm onClose={() => setShowForm(false)} />}
    </>
  );
}
