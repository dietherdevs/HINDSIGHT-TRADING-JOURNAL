import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useAppContext } from "../store/AppContext";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function TradingCalendar() {
  const { state } = useAppContext();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  // Build daily PnL map
  const dailyPnl = useMemo(() => {
    const map: Record<string, number> = {};
    state.trades.forEach((t) => {
      map[t.date] = (map[t.date] || 0) + t.pnl;
    });
    return map;
  }, [state.trades]);

  const selectedTrades = useMemo(() => {
    if (!selected) return [];
    return state.trades.filter((t) => t.date === selected);
  }, [selected, state.trades]);

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = now.toISOString().split("T")[0];

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthPnl = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    return Object.entries(dailyPnl)
      .filter(([d]) => d.startsWith(prefix))
      .reduce((s, [, v]) => s + v, 0);
  }, [dailyPnl, year, month]);

  const tradingDays = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    return Object.keys(dailyPnl).filter((d) => d.startsWith(prefix)).length;
  }, [dailyPnl, year, month]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-white">Trading Calendar</h2>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="text-[#8b8fa8] hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="text-white min-w-[130px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} className="text-[#8b8fa8] hover:text-white transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Month summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1a1d23] border border-[#2a2d35] rounded-xl p-3 text-center">
          <p className="text-[#8b8fa8] text-xs">Month PnL</p>
          <p className={`mt-1 ${monthPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {monthPnl >= 0 ? "+" : ""}${monthPnl.toFixed(2)}
          </p>
        </div>
        <div className="bg-[#1a1d23] border border-[#2a2d35] rounded-xl p-3 text-center">
          <p className="text-[#8b8fa8] text-xs">Trading Days</p>
          <p className="text-white mt-1">{tradingDays}</p>
        </div>
        <div className="bg-[#1a1d23] border border-[#2a2d35] rounded-xl p-3 text-center">
          <p className="text-[#8b8fa8] text-xs">Green Days</p>
          <p className="text-emerald-400 mt-1">
            {Object.entries(dailyPnl).filter(([d, v]) => {
              const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
              return d.startsWith(prefix) && v > 0;
            }).length}
          </p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#1a1d23] border border-[#2a2d35] rounded-xl overflow-hidden">
        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-[#2a2d35]">
          {DAYS.map((d) => (
            <div key={d} className="text-center py-2 text-[#8b8fa8] text-xs">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day) {
              return <div key={`empty-${i}`} className="aspect-square border-b border-r border-[#1e2128] last:border-r-0" />;
            }
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const pnl = dailyPnl[dateStr];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selected;
            const hasData = pnl !== undefined;

            return (
              <button
                key={dateStr}
                onClick={() => setSelected(isSelected ? null : dateStr)}
                className={`aspect-square flex flex-col items-center justify-center border-b border-r border-[#1e2128] relative transition-all text-sm
                  ${isSelected ? "ring-1 ring-inset ring-indigo-500" : ""}
                  ${hasData && pnl > 0 ? "bg-emerald-500/15 hover:bg-emerald-500/25" : ""}
                  ${hasData && pnl < 0 ? "bg-red-500/15 hover:bg-red-500/25" : ""}
                  ${!hasData ? "hover:bg-[#2a2d35]" : ""}
                `}
              >
                <span
                  className={`
                    ${isToday ? "w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white" : ""}
                    ${!isToday && hasData && pnl > 0 ? "text-emerald-400" : ""}
                    ${!isToday && hasData && pnl < 0 ? "text-red-400" : ""}
                    ${!isToday && !hasData ? "text-[#8b8fa8]" : ""}
                  `}
                >
                  {day}
                </span>
                {hasData && (
                  <span className={`text-[9px] mt-0.5 ${pnl > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {pnl > 0 ? "+" : ""}{pnl.toFixed(0)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-[#8b8fa8]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500/30" />
          Profitable day
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500/30" />
          Loss day
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-indigo-600" />
          Today
        </div>
      </div>

      {/* Selected Day Detail */}
      {selected && selectedTrades.length > 0 && (
        <div className="bg-[#1a1d23] border border-[#2a2d35] rounded-xl p-4">
          <h3 className="text-white mb-3 text-sm">
            Trades on {new Date(selected + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h3>
          <div className="space-y-2">
            {selectedTrades.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-[#2a2d35] last:border-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      t.isWin ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {t.isWin ? "WIN" : "LOSS"}
                  </span>
                  <span className="text-white text-sm">{t.asset}</span>
                  <span className="text-[#8b8fa8] text-xs">{t.direction}</span>
                </div>
                <span className={`text-sm ${t.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
                </span>
              </div>
            ))}
            <div className="flex justify-between pt-2">
              <span className="text-[#8b8fa8] text-sm">Net PnL</span>
              <span className={`text-sm ${dailyPnl[selected] >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {dailyPnl[selected] >= 0 ? "+" : ""}${dailyPnl[selected]?.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
