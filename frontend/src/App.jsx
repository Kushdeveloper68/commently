import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
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
import Terms from "./pages/legal/Terms.jsx";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy.jsx";
import RefundPolicy from "./pages/legal/RefundPolicy.jsx";

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                className: "toast-themed",
                style: {
                  background: "var(--panel)",
                  color: "var(--ink)",
                  border: "1px solid var(--border)",
                },
              }}
            />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />

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
      </ThemeProvider>
    </HelmetProvider>
  );
}
