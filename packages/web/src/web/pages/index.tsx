import { useState } from "react";
import Calculator from "../features/calculator";
import StrategyMap from "../features/strategy-map";
import History from "../features/history";
import SettingsView from "../features/settings";
import AutoMode from "../features/auto-mode";
import InstallPrompt from "../features/install-prompt";

type Tab = "auto" | "calc" | "map" | "history" | "settings";

const TABS: { id: Tab; label: string; icon: JSX.Element }[] = [
  {
    id: "auto",
    label: "Auto",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>
    ),
  },
  {
    id: "calc",
    label: "Calcular",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10"/><line x1="12" y1="10" x2="12" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="18"/><line x1="8" y1="18" x2="12" y2="18"/></svg>
    ),
  },
  {
    id: "map",
    label: "Mapa",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
    ),
  },
  {
    id: "history",
    label: "Histórico",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><polyline points="12 7 12 12 15 15"/></svg>
    ),
  },
  {
    id: "settings",
    label: "Config",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    ),
  },
];

export default function Index() {
  const [tab, setTab] = useState<Tab>("auto");

  return (
    <div
      style={{ background: "var(--cc-bg)", minHeight: "100dvh" }}
      className="flex flex-col items-center"
    >
      <div className="w-full max-w-[480px] flex flex-col" style={{ minHeight: "100dvh" }}>
        {/* Header */}
        <header className="cc-safe-top px-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center"
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: "linear-gradient(135deg,#16C784,#0e9e68)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1 }}>Corrida Certa</div>
              <div style={{ fontSize: 11, color: "var(--cc-text2)", fontWeight: 500 }}>São Carlos · SP</div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 pb-28">
          <div key={tab} className="cc-fade">
            {tab === "auto" && <AutoMode />}
            {tab === "calc" && <Calculator />}
            {tab === "map" && <StrategyMap />}
            {tab === "history" && <History />}
            {tab === "settings" && <SettingsView />}
          </div>
        </main>

        {/* Tab bar */}
        <nav
          className="cc-tabbar fixed bottom-0 w-full max-w-[480px] px-2 pt-2"
          style={{
            background: "rgba(11,15,20,0.92)",
            backdropFilter: "blur(12px)",
            borderTop: "1px solid var(--cc-border)",
            zIndex: 900,
          }}
        >
          <div className="grid grid-cols-5">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex flex-col items-center justify-center gap-1 py-2"
                  style={{
                    color: active ? "var(--cc-good)" : "var(--cc-text2)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {t.icon}
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      <InstallPrompt />
    </div>
  );
}
