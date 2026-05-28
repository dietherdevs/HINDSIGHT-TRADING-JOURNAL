import { CheckSquare, RotateCcw, Plus, Trash2, X, Check } from "lucide-react";
import { useState } from "react";
import { useAppContext } from "../store/AppContext";

export function Checklist() {
  // Destructured both addChecklistItem and deleteChecklistItem
  const { state, toggleChecklistItem, resetChecklist, deleteChecklistItem, addChecklistItem } = useAppContext();
  const { checklist } = state;
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  const completed = checklist.filter((c) => c.checked).length;
  const percent = checklist.length === 0 ? 0 : Math.round((completed / checklist.length) * 100);

  const allChecked = completed === checklist.length && checklist.length > 0;

  // Function to handle adding the item
  const handleAdd = () => {
    if (newLabel.trim()) {
      addChecklistItem(newLabel.trim());
      setNewLabel("");
      setAdding(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white">Trading Plan</h2>
          <p className="text-[#8b8fa8] text-sm">Daily pre-trade checklist</p>
        </div>
        <button
          onClick={resetChecklist}
          className="flex items-center gap-1.5 text-[#8b8fa8] hover:text-white text-sm transition-colors border border-[#2a2d35] rounded-lg px-3 py-1.5"
        >
          <RotateCcw size={13} />
          Reset
        </button>
      </div>

      {/* Progress */}
      <div className="bg-[#1a1d23] border border-[#2a2d35] rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white text-sm">
            {completed} / {checklist.length} completed
          </span>
          <span
            className={`text-sm ${
              allChecked ? "text-emerald-400" : percent >= 50 ? "text-yellow-400" : "text-[#8b8fa8]"
            }`}
          >
            {percent}%
          </span>
        </div>
        <div className="h-2 bg-[#2a2d35] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              allChecked ? "bg-emerald-500" : "bg-indigo-500"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
        {allChecked && (
          <p className="text-emerald-400 text-sm mt-3 text-center">
            All checks passed — you're ready to trade!
          </p>
        )}
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {checklist.map((item, idx) => (
          <div
            key={item.id}
            role="button"
            onClick={() => toggleChecklistItem(item.id)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left cursor-pointer ${
              item.checked
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-[#1a1d23] border-[#2a2d35] hover:border-[#4a4d55]"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                item.checked
                  ? "bg-emerald-500 border-emerald-500"
                  : "border-[#4a4d55]"
              }`}
            >
              {item.checked && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span
              className={`flex-1 text-sm ${
                item.checked ? "text-emerald-400 line-through" : "text-white"
              }`}
            >
              {item.label}
            </span>
            <span className="text-[#4a4d55] text-xs">{idx + 1}</span>
            
            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation(); 
                deleteChecklistItem(item.id);
              }}
              className="text-[#4a4d55] hover:text-red-400 transition-colors ml-1 p-1 rounded hover:bg-red-400/10"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* Add New Item */}
      {adding ? (
        <div className="flex gap-2">
          <input
            autoFocus
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAdd();
              }
              if (e.key === "Escape") {
                setAdding(false);
                setNewLabel("");
              }
            }}
            placeholder="New checklist item..."
            className="flex-1 bg-[#1a1d23] border border-[#2a2d35] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {/* Add Item Button */}
          <button
            onClick={handleAdd}
            className="text-emerald-400 hover:text-white px-3 border border-[#2a2d35] rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
          >
            <Check size={14} />
          </button>
          {/* Cancel Add Button */}
          <button
            onClick={() => {
              setAdding(false);
              setNewLabel("");
            }}
            className="text-[#8b8fa8] hover:text-white px-3 border border-[#2a2d35] rounded-xl hover:bg-[#2a2d35] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-[#2a2d35] rounded-xl text-[#8b8fa8] hover:text-white hover:border-[#4a4d55] transition-colors text-sm"
        >
          <Plus size={14} />
          Add custom item
        </button>
      )}

      {/* Trading Rules Card */}
      <div className="bg-[#1a1d23] border border-[#2a2d35] rounded-xl p-4">
        <h3 className="text-white mb-3 text-sm">Prop Firm Rules Reminder</h3>
        <ul className="space-y-2 text-sm text-[#8b8fa8]">
          {[
            "Never exceed daily drawdown limit",
            "Max 5% total drawdown per account",
            "No trading during NFP / FOMC unless planned",
            "Close all trades before weekend (Friday close)",
            "Log every trade — no exceptions",
          ].map((rule) => (
            <li key={rule} className="flex items-start gap-2">
              <span className="text-indigo-400 mt-0.5 flex-shrink-0">→</span>
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}