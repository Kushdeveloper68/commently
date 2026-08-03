import { useState } from "react";
import AppSidebar from "./AppSidebar.jsx";
import TopBar from "./TopBar.jsx";

export default function AppLayout({ children, hasAlerts }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background mt-16">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuClick={() => setSidebarOpen(true)} hasAlerts={hasAlerts} />
      <main className="md:ml-64 pt-16 min-h-screen p-4 sm:p-6 md:p-8">{children}</main>
    </div>
  );
}
