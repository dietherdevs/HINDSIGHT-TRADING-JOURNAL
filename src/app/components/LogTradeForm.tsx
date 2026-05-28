import { useState, useRef, useMemo } from "react";
import { X, Upload, TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import { useAppContext } from "../store/AppContext";

const ASSETS = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "USDCAD", "AUDUSD", "BTCUSD", "ETHUSD", "NASDAQ", "US30"];

// Units per 1 standard lot for each instrument
const CONTRACT_SIZE: Record<string, number> = {
  XAUUSD: 100,       // 100 oz/lot → pip $0.01 → $1/pip/lot
  EURUSD: 100000,
  GBPUSD: 100000,
  USDJPY: 100000,    // result will be in JPY, divided by avg price to get USD
  USDCAD: 100000,
  AUDUSD: 100000,
  BTCUSD: 1,
  ETHUSD: 1,
  NASDAQ: 20,        // E-mini NQ $20/point
  US30: 5,           // E-mini YM $5/point
  OTHER: 100000,
};

const JPY_PAIRS = new Set(["USDJPY"]);

function calcPnl(
  asset: string,
  direction: "Long" | "Short",
  entry: number,
  exit: number,
  lotSize: number
): number {
  const dir = direction === "Long" ? 1 : -1;
  const size = CONTRACT_SIZE[asset] ?? 100000;
  let pnl = dir * (exit - entry) * size * lotSize;
  if (JPY_PAIRS.has(asset)) {
    // Convert JPY result to USD using average price
    const avgPrice = (entry + exit) / 2;
    pnl = pnl / avgPrice;
  }
  return pnl;
}

function calcRR(
  direction: "Long" | "Short",
  entry: number,
  exit: number,
  stopLoss: number
): number {
  const reward = Math.abs(exit - entry);
  const risk = Math.abs(entry - stopLoss);
  if (risk === 0) return 0;
  // Validate direction makes sense with SL
  if (direction === "Long" && stopLoss >= entry) return 0;
  if (direction === "Short" && stopLoss <= entry) return 0;
  return reward / risk;
}

interface FormData {
  date: string;
  asset: string;
  direction: "Long" | "Short";
  lotSize: string;
  entryPrice: string;
  exitPrice: string;
  stopLoss: string;
  notes: string;
}

const initial: FormData = {
  date: new Date().toISOString().split("T")[0],
  asset: "XAUUSD",
  direction: "Long",
  lotSize: "",
  entryPrice: "",
  exitPrice: "",
  stopLoss: "",
  notes: "",
};

type FieldErrors = Partial<Record<keyof FormData, string>>;

export function LogTradeForm({ onClose }: { onClose: () => void }) {
  const { addTrade } = useAppContext();
  const [form, setForm] = useState<FormData>(initial);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  // Derived computed values — live-updated as the user types
  const computed = useMemo(() => {
    const entry = parseFloat(form.entryPrice);
    const exit = parseFloat(form.exitPrice);
    const lot = parseFloat(form.lotSize);
    const sl = parseFloat(form.stopLoss);

    const hasPrices = !isNaN(entry) && !isNaN(exit) && !isNaN(lot) && lot > 0;
    const hasSL = !isNaN(sl) && sl > 0;

    const pnl = hasPrices ? calcPnl(form.asset, form.direction, entry, exit, lot) : null;
    const rr = hasPrices && hasSL ? calcRR(form.direction, entry, exit, sl) : null;
    const isWin = pnl !== null ? pnl > 0 : null;

    return { pnl, rr, isWin };
  }, [form.entryPrice, form.exitPrice, form.lotSize, form.stopLoss, form.direction, form.asset]);

  function validate(): boolean {
    const e: FieldErrors = {};
    if (!form.date) e.date = "Required";
    if (!form.entryPrice || isNaN(Number(form.entryPrice))) e.entryPrice = "Required";
    if (!form.exitPrice || isNaN(Number(form.exitPrice))) e.exitPrice = "Required";
    if (!form.lotSize || isNaN(Number(form.lotSize)) || Number(form.lotSize) <= 0) e.lotSize = "Must be > 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const pnl = computed.pnl ?? 0;
    const rr = computed.rr ?? 0;
    await addTrade(
      {
        date: form.date,
        asset: form.asset,
        direction: form.direction,
        lotSize: parseFloat(form.lotSize),
        entryPrice: parseFloat(form.entryPrice),
        exitPrice: parseFloat(form.exitPrice),
        pnl,
        rr,
        notes: form.notes,
        isWin: pnl > 0,
      },
      screenshot ?? undefined
    );
    setSubmitting(false);
    onClose();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  }

  const pnlReady = computed.pnl !== null;
  const rrReady = computed.rr !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-[#13151c] border border-[#2a2d35] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2d35] sticky top-0 bg-[#13151c] z-10">
          <h2 className="text-white">Log Trade</h2>
          <button onClick={onClose} className="text-[#8b8fa8] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Date & Asset */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#8b8fa8] text-sm mb-1 block">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="w-full bg-[#1a1d23] border border-[#2a2d35] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="text-[#8b8fa8] text-sm mb-1 block">Asset / Pair</label>
              <div className="relative">
                <select
                  value={form.asset}
                  onChange={(e) => set("asset", e.target.value)}
                  className="w-full bg-[#1a1d23] border border-[#2a2d35] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors appearance-none pr-8"
                >
                  {ASSETS.map((a) => <option key={a} value={a}>{a}</option>)}
                  <option value="OTHER">Other</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b8fa8] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Direction */}
          <div>
            <label className="text-[#8b8fa8] text-sm mb-1 block">Direction</label>
            <div className="grid grid-cols-2 gap-2">
              {(["Long", "Short"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set("direction", d)}
                  className={`py-2 rounded-lg text-sm transition-all ${
                    form.direction === d
                      ? d === "Long"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                        : "bg-red-500/20 text-red-400 border border-red-500/50"
                      : "bg-[#1a1d23] text-[#8b8fa8] border border-[#2a2d35] hover:border-[#4a4d55]"
                  }`}
                >
                  {d === "Long" ? "▲ Long" : "▼ Short"}
                </button>
              ))}
            </div>
          </div>

          {/* Entry / Exit / Lot */}
          <div className="grid grid-cols-3 gap-3">
            {([
              { key: "entryPrice" as const, label: "Entry Price" },
              { key: "exitPrice" as const, label: "Exit Price" },
              { key: "lotSize" as const, label: "Lot Size" },
            ] as const).map(({ key, label }) => (
              <div key={key}>
                <label className="text-[#8b8fa8] text-sm mb-1 block">{label}</label>
                <input
                  type="number"
                  step="any"
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#1a1d23] border border-[#2a2d35] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
                {errors[key] && <p className="text-red-400 text-xs mt-1">{errors[key]}</p>}
              </div>
            ))}
          </div>

          {/* Stop Loss */}
          <div>
            <label className="text-[#8b8fa8] text-sm mb-1 block">
              Stop Loss <span className="text-[#4a4d55] text-xs">(optional — used to compute R:R)</span>
            </label>
            <input
              type="number"
              step="any"
              value={form.stopLoss}
              onChange={(e) => set("stopLoss", e.target.value)}
              placeholder="e.g. 2310.00"
              className="w-full bg-[#1a1d23] border border-[#2a2d35] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Auto-Computed Results */}
          <div className="grid grid-cols-2 gap-3">
            {/* PnL */}
            <div
              className={`rounded-xl border p-3 transition-all ${
                !pnlReady
                  ? "bg-[#1a1d23] border-[#2a2d35]"
                  : computed.isWin
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <p className="text-[#8b8fa8] text-xs mb-1">Computed PnL</p>
              {pnlReady ? (
                <div className="flex items-center gap-1.5">
                  {computed.isWin ? (
                    <TrendingUp size={14} className="text-emerald-400" />
                  ) : (
                    <TrendingDown size={14} className="text-red-400" />
                  )}
                  <span
                    className={`${computed.isWin ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {(computed.pnl! >= 0 ? "+" : "")}${computed.pnl!.toFixed(2)}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ml-auto ${
                      computed.isWin
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {computed.isWin ? "WIN" : "LOSS"}
                  </span>
                </div>
              ) : (
                <span className="text-[#4a4d55] text-sm">Fill entry, exit & lot</span>
              )}
            </div>

            {/* R:R */}
            <div className="bg-[#1a1d23] border border-[#2a2d35] rounded-xl p-3">
              <p className="text-[#8b8fa8] text-xs mb-1">Risk : Reward</p>
              {rrReady && computed.rr! > 0 ? (
                <span className="text-purple-400">
                  1 : {computed.rr!.toFixed(2)}
                </span>
              ) : (
                <span className="text-[#4a4d55] text-sm">
                  {form.stopLoss ? "Check SL direction" : "Add stop loss"}
                </span>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[#8b8fa8] text-sm mb-1 block">Notes / Analysis</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="Setup, confluences, lessons learned..."
              className="w-full bg-[#1a1d23] border border-[#2a2d35] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Screenshot */}
          <div>
            <label className="text-[#8b8fa8] text-sm mb-1 block">Trade Screenshot</label>
            {screenshot ? (
              <div className="relative rounded-lg overflow-hidden border border-[#2a2d35]">
                <img src={screenshot} alt="Trade screenshot" className="w-full h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => setScreenshot(null)}
                  className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 hover:bg-black/90"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-[#2a2d35] rounded-lg py-6 flex flex-col items-center gap-2 text-[#8b8fa8] hover:border-indigo-500/50 hover:text-indigo-400 transition-colors"
              >
                <Upload size={20} />
                <span className="text-sm">Upload screenshot</span>
                <span className="text-xs">PNG, JPG up to 10MB</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !pnlReady}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-3 text-sm transition-colors"
          >
            {submitting ? "Saving..." : pnlReady ? `Log Trade · ${computed.isWin ? "WIN" : "LOSS"} ${computed.pnl! >= 0 ? "+" : ""}$${computed.pnl!.toFixed(2)}` : "Fill in prices to continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
