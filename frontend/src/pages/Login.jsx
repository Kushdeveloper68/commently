import { useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import { MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef(null);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      /* global google */
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "filled_black",
        size: "large",
        width: 340,
        shape: "pill",
      });
    };
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  const handleCredentialResponse = async (response) => {
    try {
      await loginWithGoogle(response.credential);
      toast.success("Welcome to Commently!");
      navigate("/dashboard");
    } catch (err) {
      toast.error("Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface relative overflow-hidden">
      <Helmet>
        <title>Sign In — Commently</title>
      </Helmet>

      {/* Ambient background glows */}
      <div
        className="absolute w-[800px] h-[800px] -top-1/4 -left-1/4 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle at center, rgba(89,140,255,0.10) 0%, rgba(89,140,255,0) 70%)", filter: "blur(80px)" }}
      />
      <div
        className="absolute w-[600px] h-[600px] bottom-0 right-0 opacity-50 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle at center, rgba(89,140,255,0.10) 0%, rgba(89,140,255,0) 70%)", filter: "blur(80px)" }}
      />

      <main className="relative z-10 grid lg:grid-cols-[1.2fr_1fr] min-h-screen">
        {/* Brand side — hidden below lg, matches the design's asymmetric split */}
        <div className="hidden lg:flex relative items-center justify-center p-section-gap overflow-hidden border-r border-white/5" style={{ background: "linear-gradient(135deg, #0b0e15 0%, #11131b 100%)" }}>
          <div className="relative z-10 max-w-xl">
            <div className="mb-stack-lg flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <MessageSquare size={19} className="text-on-primary" />
              </div>
              <span className="text-h1 tracking-tighter font-bold text-white">Commently</span>
            </div>
            <h3 className="text-display-lg mb-stack-md leading-[1.05] tracking-tight text-on-surface font-bold">
              The operating system for <span className="text-primary/90">social growth.</span>
            </h3>
            <p className="text-body-lg text-on-surface-variant max-w-md opacity-70 leading-relaxed">
              Scale your Instagram presence with precision automation and instant customer conversion.
            </p>

            <div className="mt-16 flex gap-8 border-t border-white/5 pt-8">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-primary" />
                <span className="text-label-sm text-on-surface-variant">Meta-verified API access</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Sparkles size={18} className="text-tertiary" />
                <span className="text-label-sm text-on-surface-variant">1-click setup</span>
              </div>
            </div>
          </div>
        </div>

        {/* Auth side */}
        <div className="flex items-center justify-center p-gutter relative">
          <div className="w-full max-w-[440px]">
            <div className="lg:hidden mb-stack-lg flex flex-col items-center text-center">
              <h1 className="text-h1 tracking-tighter mb-1 font-bold text-white">Commently</h1>
              <p className="text-on-surface-variant text-label-sm opacity-60">Instagram automation, done right</p>
            </div>

            <div className="glass-card rounded-2xl p-8 sm:p-padding-card relative overflow-hidden">
              <div className="relative z-10">
                <header className="mb-stack-lg">
                  <h2 className="text-h1 text-on-surface mb-1 tracking-tight font-bold">Sign in to continue</h2>
                  <p className="text-on-surface-variant opacity-70 text-body-md">Enter the command center to manage your growth.</p>
                </header>

                <div ref={buttonRef} className="flex justify-center [&>div]:!w-full" />

                <div className="w-full flex items-center gap-stack-md my-stack-lg">
                  <div className="h-px bg-white/10 flex-grow" />
                  <span className="text-on-surface-variant text-[10px] uppercase tracking-[0.2em] font-black opacity-30">Secure sign-in</span>
                  <div className="h-px bg-white/10 flex-grow" />
                </div>

                <div className="grid grid-cols-2 gap-stack-sm w-full">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <ShieldCheck size={16} className="text-primary" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-on-surface tracking-wide uppercase opacity-90">Secure auth</span>
                      <span className="text-[10px] text-on-surface-variant opacity-60">Google OAuth 2.0</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center shrink-0">
                      <Sparkles size={16} className="text-tertiary" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-on-surface tracking-wide uppercase opacity-90">Instant flow</span>
                      <span className="text-[10px] text-on-surface-variant opacity-60">1-click setup</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <footer className="mt-stack-lg text-center">
              <div className="flex items-center justify-center gap-stack-md text-[12px] text-on-surface-variant/40 font-medium">
                <Link className="hover:text-primary transition-colors hover:underline underline-offset-4" to="/terms">Terms of Service</Link>
                <span className="w-1 h-1 rounded-full bg-white/10" />
                <Link className="hover:text-primary transition-colors hover:underline underline-offset-4" to="/privacy">Privacy Policy</Link>
                <span className="w-1 h-1 rounded-full bg-white/10" />
                <Link className="hover:text-primary transition-colors hover:underline underline-offset-4" to="/refund-policy">Refund Policy</Link>
              </div>
              <p className="mt-stack-sm text-[11px] text-on-surface-variant/30 uppercase tracking-widest font-bold">
                © 2026 Commently
              </p>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
