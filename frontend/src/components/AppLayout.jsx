import Sidebar from "./Sidebar.jsx";

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      {/* pt-14 clears the mobile top bar; md:ml-64 clears the desktop rail */}
      <main className="pt-14 md:pt-0 md:ml-64 p-4 sm:p-6 md:p-8 max-w-6xl">{children}</main>
    </div>
  );
}
