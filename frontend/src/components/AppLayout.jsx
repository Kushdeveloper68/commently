import Sidebar from "./Sidebar.jsx";

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <main className="ml-64 p-8 max-w-6xl">{children}</main>
    </div>
  );
}
