import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

// Landing/Login/legal stay eager — they're the first thing a new visitor
// loads, and shouldn't wait on the authenticated app's bundle. Everything
// behind a login is lazy-loaded, so the public pages stay fast.
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Terms from "./pages/legal/Terms.jsx";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy.jsx";
import RefundPolicy from "./pages/legal/RefundPolicy.jsx";
import NotFound from "./pages/NotFound.jsx";

const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const ConnectInstagram = lazy(() => import("./pages/ConnectInstagram.jsx"));
const Automations = lazy(() => import("./pages/Automations.jsx"));
const AutomationBuilder = lazy(() => import("./pages/AutomationBuilder.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const Billing = lazy(() => import("./pages/Billing.jsx"));
const Analytics = lazy(() => import("./pages/Analytics.jsx"));
const HelpSupport = lazy(() => import("./pages/HelpSupport.jsx"));

function PageFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider>
          <BrowserRouter>
            <AuthProvider>
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: "#161718",
                    color: "#e1e2ed",
                    border: "1px solid #23252A",
                  },
                }}
              />
              <Suspense fallback={<PageFallback />}>
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
                  <Route path="/help" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
