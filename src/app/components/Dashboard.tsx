import { useMemo, ElementType } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, BarChart2, Target, DollarSign, Percent } from "lucide-react";
import { useAppContext } from "../store/AppContext";
import { Trade } from "../store/db";

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string;
  icon: ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-[#1a1d23] border border-[#2a2d35] rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[#8b8fa8] text-sm">{label}</span>
        <div className={`p-1.5 rounded-lg ${color}`}>
          <Icon size={14} />
        </div>
      </div>
      <span className="text-white text-2xl">{value}</span>
      {sub && <span className="text-[#8b8fa8] text-xs">{sub}</span>}
    </div>
  );
}

function buildEquityCurve(trades: Trade[]) {
  const byDay: Record<string, number> = {};
  trades.forEach((t) => {
    byDay[t.date] = (byDay[t.date] || 0) + t.pnl;
  });
  const sortedDays = Object.keys(byDay).sort((a, b) => a.localeCompare(b));
  let cumulative = 0;
  return sortedDays.map((day) => {
    cumulative += byDay[day];
    return {
      date: new Date(day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      equity: parseFloat(cumulative.toFixed(2)),
    };
  });
}

function buildDailyPnl(trades: Trade[]) {
  const map: Record<string, number> = {};
  trades.forEach((t) => {
    map[t.date] = (map[t.date] || 0) + t.pnl;
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, pnl]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      pnl: parseFloat(pnl.toFixed(2)),
    }));
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const isPos = val >= 0;
    return (
      <div className="bg-[#1a1d23] border border-[#2a2d35] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-[#8b8fa8] text-xs mb-1">{label}</p>
        <p className={`${isPos ? "text-emerald-400" : "text-red-400"}`}>
          {isPos ? "+" : ""}${val.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

export function Dashboard() {
  const { state } = useAppContext();
  const { trades } = state;

  const metrics = useMemo(() => {
    if (!trades.length) return null;
    const wins = trades.filter((t) => t.isWin).length;
    const winRate = (wins / trades.length) * 100;
    const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
    const avgRr = trades.reduce((s, t) => s + t.rr, 0) / trades.length;
    const profitFactor = (() => {
      const gross = trades.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
      const loss = Math.abs(trades.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
      return loss === 0 ? gross : gross / loss;
    })();
    return { wins, winRate, totalPnl, avgRr, profitFactor };
  }, [trades]);

  const equityData = useMemo(() => buildEquityCurve(trades), [trades]);
  const dailyPnlData = useMemo(() => buildDailyPnl(trades), [trades]);

  if (!trades.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <BarChart2 size={48} className="text-[#2a2d35]" />
        <p className="text-[#8b8fa8]">No trades yet. Log your first trade to see your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Total Trades"
          value={String(trades.length)}
          icon={BarChart2}
          color="bg-blue-500/20 text-blue-400"
          sub={`${metrics?.wins} wins / ${trades.length - (metrics?.wins ?? 0)} losses`}
        />
        <MetricCard
          label="Win Rate"
          value={`${metrics?.winRate.toFixed(1)}%`}
          icon={Percent}
          color={
            (metrics?.winRate ?? 0) >= 50
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-red-500/20 text-red-400"
          }
        />
        <MetricCard
          label="Total PnL"
          value={`${(metrics?.totalPnl ?? 0) >= 0 ? "+" : ""}$${metrics?.totalPnl.toFixed(2)}`}
          icon={(metrics?.totalPnl ?? 0) >= 0 ? TrendingUp : TrendingDown}
          color={
            (metrics?.totalPnl ?? 0) >= 0
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-red-500/20 text-red-400"
          }
        />
        <MetricCard
          label="Avg R:R"
          value={`1:${metrics?.avgRr.toFixed(2)}`}
          icon={Target}
          color="bg-purple-500/20 text-purple-400"
          sub={`Profit factor: ${metrics?.profitFactor.toFixed(2)}`}
        />
      </div>

      {/* Equity Curve */}
      <div className="bg-[#1a1d23] border border-[#2a2d35] rounded-xl p-4">
        <h3 className="text-white mb-4">Equity Curve</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={equityData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
            <XAxis dataKey="date" tick={{ fill: "#8b8fa8", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "#8b8fa8", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#2a2d35" />
            <Area
              type="monotone"
              dataKey="equity"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#equityGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#10b981" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Daily PnL Bars */}
      <div className="bg-[#1a1d23] border border-[#2a2d35] rounded-xl p-4">
        <h3 className="text-white mb-4">Daily PnL (Last 14 Days)</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={dailyPnlData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#8b8fa8", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "#8b8fa8", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#4a4d55" />
            <Bar dataKey="pnl" radius={[3, 3, 0, 0]} maxBarSize={12}>
              {dailyPnlData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.pnl >= 0 ? "#10b981" : "#ef4444"}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Trades Summary */}
      <div className="bg-[#1a1d23] border border-[#2a2d35] rounded-xl p-4">
        <h3 className="text-white mb-3">Recent Trades</h3>
        <div className="space-y-2">
          {trades.slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-[#2a2d35] last:border-0">
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    t.isWin ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {t.isWin ? "WIN" : "LOSS"}
                </span>
                <div>
                  <p className="text-white text-sm">{t.asset}</p>
                  <p className="text-[#8b8fa8] text-xs">{t.direction} · {t.date}</p>
                </div>
              </div>
              <span className={`${t.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
