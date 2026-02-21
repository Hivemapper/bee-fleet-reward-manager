import { useState, useEffect } from "react";
import { LayoutDashboard, Settings as SettingsIcon } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import DriverDetail from "./pages/DriverDetail";
import Settings from "./pages/Settings";

function NavTab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-colors ${
        active
          ? "border-[#fd8c73] text-white font-semibold"
          : "border-transparent text-[#ffffffb3] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [hasApiKey, setHasApiKey] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);

  async function checkApiKey() {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setHasApiKey(data.hasApiKey);
      if (!data.hasApiKey) setPage("settings");
    } catch {
      setHasApiKey(false);
    }
  }

  useEffect(() => {
    checkApiKey();
  }, []);

  function openDriver(driver) {
    setSelectedDriver(driver);
    setPage("driver");
  }

  function goHome() {
    setSelectedDriver(null);
    setPage("dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* GitHub-style dark header */}
      <header className="bg-[#24292f]">
        <div className="max-w-[1280px] mx-auto px-4 flex items-center h-16 gap-4">
          <button
            className="flex items-center gap-2 text-base font-semibold text-white cursor-pointer hover:opacity-80 mr-4"
            onClick={goHome}
          >
            <img src="/logo.png" alt="Bee" className="h-8 w-8 rounded-full" />
            Fleet Manager
          </button>
          <nav className="flex items-end h-full">
            <NavTab
              active={page === "dashboard" || page === "driver"}
              onClick={goHome}
            >
              <LayoutDashboard className="h-4 w-4" />
              Drivers
            </NavTab>
            <NavTab
              active={page === "settings"}
              onClick={() => setPage("settings")}
            >
              <SettingsIcon className="h-4 w-4" />
              Settings
            </NavTab>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-[1280px] mx-auto px-4 py-6">
        {page === "settings" ? (
          <Settings
            onSaved={() => {
              setHasApiKey(true);
              goHome();
            }}
          />
        ) : page === "driver" && selectedDriver ? (
          <DriverDetail driver={selectedDriver} onBack={goHome} />
        ) : (
          <Dashboard
            hasApiKey={hasApiKey}
            onGoToSettings={() => setPage("settings")}
            onSelectDriver={openDriver}
          />
        )}
      </main>
    </div>
  );
}
