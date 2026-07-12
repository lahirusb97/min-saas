import { useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { FixDeskProvider, useFixDesk } from "../context/FixDeskContext";
import { Sidebar } from "../components/Sidebar";
import { Topbar } from "../components/Topbar";
import { BottomNav } from "../components/BottomNav";
import { Toast } from "../components/Toast";
import "../fixdesk.css";

function CustomerDatalist() {
  const { db } = useFixDesk();
  return (
    <datalist id="custDatalist">
      {db.customers.map((c) => (
        <option key={c.id} value={c.name} />
      ))}
    </datalist>
  );
}

function viewFromPath(pathname: string) {
  const segment = pathname.replace(/^\/dashboard\/?/, "").split("/")[0];
  return segment || "dashboard";
}

function DashboardShell() {
  const location = useLocation();
  const view = viewFromPath(location.pathname);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // theme state (persisted in localStorage)
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (
      (localStorage.getItem("fixdesk-theme") as "dark" | "light") || "light"
    );
  });

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "light";
    setTheme(nextTheme);
    localStorage.setItem("fixdesk-theme", nextTheme);
  }

  function focusSearch() {
    searchInputRef.current?.focus();
    searchInputRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  return (
    <div className={`fixdesk ${theme === "light" ? "light-theme" : ""}`}>
      <div className="app">
        <Sidebar onSearchClick={focusSearch} />
        <main className="main">
          <Topbar
            view={view}
            searchInputRef={searchInputRef}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
          <div className="content">
            <Outlet context={{ focusSearch }} />
          </div>
        </main>
      </div>
      <BottomNav />
      <Toast />
      <CustomerDatalist />
    </div>
  );
}

export function DashboardLayout() {
  return (
    <FixDeskProvider>
      <DashboardShell />
    </FixDeskProvider>
  );
}
