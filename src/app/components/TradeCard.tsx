import { useState, useEffect } from "react";
import { Trash2, ImageIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Trade, getScreenshot } from "../store/db";
import { useAppContext } from "../store/AppContext";

export function TradeCard({ trade }: { trade: Trade }) {
  const { removeTrade } = useAppContext();
  const [expanded, setExpanded] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    if (expanded && trade.screenshotId && !imgSrc) {
      getScreenshot(trade.screenshotId).then(setImgSrc);
    }
  }, [expanded, trade.screenshotId, imgSrc]);

  return (
    <div className="bg-[#1a1d23] border border-[#2a2d35] rounded-xl overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center gap-3 p-3">
        <div
          className={`w-1 self-stretch rounded-full ${trade.isWin ? "bg-emerald-500" : "bg-red-500"}`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white">{trade.asset}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                trade.direction === "Long"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-orange-500/20 text-orange-400"
              }`}
            >
              {trade.direction}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                trade.isWin ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
              }`}
            >
              {trade.isWin ? "WIN" : "LOSS"}
            </span>
          </div>
          <p className="text-[#8b8fa8] text-xs mt-0.5">{trade.date} · {trade.lotSize} lots</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`${trade.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
          </p>
          <p className="text-[#8b8fa8] text-xs">1:{trade.rr}R</p>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[#8b8fa8] hover:text-white transition-colors ml-1"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-[#2a2d35] p-3 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-[#8b8fa8] text-xs">Entry</p>
              <p className="text-white">{trade.entryPrice}</p>
            </div>
            <div>
              <p className="text-[#8b8fa8] text-xs">Exit</p>
              <p className="text-white">{trade.exitPrice}</p>
            </div>
            <div>
              <p className="text-[#8b8fa8] text-xs">Lot Size</p>
              <p className="text-white">{trade.lotSize}</p>
            </div>
          </div>

          {trade.notes && (
            <div>
              <p className="text-[#8b8fa8] text-xs mb-1">Notes</p>
              <p className="text-white text-sm leading-relaxed">{trade.notes}</p>
            </div>
          )}

          {trade.screenshotId && (
            <div>
              <p className="text-[#8b8fa8] text-xs mb-2">Screenshot</p>
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt="Trade screenshot"
                  className="w-full rounded-lg border border-[#2a2d35] object-cover max-h-64"
                />
              ) : (
                <div className="flex items-center gap-2 text-[#8b8fa8] text-sm">
                  <ImageIcon size={14} />
                  <span>Loading screenshot...</span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => removeTrade(trade.id, trade.screenshotId)}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors"
          >
            <Trash2 size={14} />
            Delete trade
          </button>
        </div>
      )}
    </div>
  );
}
