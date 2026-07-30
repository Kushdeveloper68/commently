import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ConnectInstagram from "./pages/ConnectInstagram.jsx";
import Automations from "./pages/Automations.jsx";
import AutomationBuilder from "./pages/AutomationBuilder.jsx";
import Profile from "./pages/Profile.jsx";
import Billing from "./pages/Billing.jsx";
import Analytics from "./pages/Analytics.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: "#1a1a1a", color: "#ece7dd", border: "1px solid rgba(201,168,106,0.2)" },
          }}
        />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/connect-instagram" element={<ProtectedRoute><ConnectInstagram /></ProtectedRoute>} />
          <Route path="/automations" element={<ProtectedRoute><Automations /></ProtectedRoute>} />
          <Route path="/automations/:id" element={<ProtectedRoute><AutomationBuilder /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}