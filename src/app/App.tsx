import { useState } from "react";
import { LayoutDashboard, BookOpen, CalendarDays, ClipboardCheck } from "lucide-react";
import { AppProvider } from "./store/AppContext";
import { Dashboard } from "./components/Dashboard";
import { Journal } from "./components/Journal";
import { TradingCalendar } from "./components/TradingCalendar";
import { Checklist } from "./components/Checklist";

// Import your custom logo
import myLogo from "../assets/HLOGO.png";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "journal", label: "Journal", icon: BookOpen },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "checklist", label: "Plan", icon: ClipboardCheck },
];

function AppInner() {
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white flex flex-col">
      {/* Top Header */}
      <header className="bg-[#13151c] border-b border-[#2a2d35] px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        
        {/* Clickable Logo & Title Group */}
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setTab("dashboard")}
          role="button"
          aria-label="Go to Dashboard"
        >
          <img 
            src={myLogo} 
            alt="Hindsight Logo" 
            className="w-8 h-8 rounded-lg object-cover shadow-lg shadow-indigo-500/20"
          />
          <span className="text-white font-medium tracking-wide">HINDSIGHT</span>
          <span className="text-[#8b8fa8] text-xs hidden sm:block ml-2 border-l border-[#2a2d35] pl-3">
          </span>
        </div>
        
        <div className="text-[#8b8fa8] text-xs hidden md:block">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        </div>

        {/* Desktop Nav */}
        <nav className="hidden sm:flex items-center gap-1 bg-[#1a1d23] rounded-xl p-1 border border-[#2a2d35]">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                tab === id
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-[#8b8fa8] hover:text-white"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 pb-24 sm:pb-5">
        {tab === "dashboard" && <Dashboard />}
        {tab === "journal" && <Journal />}
        {tab === "calendar" && <TradingCalendar />}
        {tab === "checklist" && <Checklist />}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-[#13151c] border-t border-[#2a2d35] flex z-20 pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
              tab === id ? "text-indigo-400" : "text-[#8b8fa8]"
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}