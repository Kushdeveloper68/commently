import { useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
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
        width: 280,
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
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <Link to="/" className="font-display text-3xl font-bold text-gold-bright">
          Commently
        </Link>
        <p className="text-muted text-sm mt-2 mb-10">
          Turn Instagram comments into customers, automatically.
        </p>

        <div className="card">
          <h2 className="font-semibold text-ink mb-6">Sign in to continue</h2>
          <div ref={buttonRef} className="flex justify-center" />
        </div>

        <p className="text-xs text-muted mt-6">
          By continuing, you agree to Commently's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
