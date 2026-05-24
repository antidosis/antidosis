import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@mobile/hooks/useAuth";
import { useHaptics } from "@mobile/hooks/useNative";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { hapticImpact } from "@mobile/lib/native";
import { Button } from "@mobile/components/ui";

/* ═══════════════════════════════════════════════════════════════
   FORGOT PASSWORD SCREEN
   $ passwd --reset — send Supabase password reset email.
   ═══════════════════════════════════════════════════════════════ */

export function ForgotPasswordScreen() {
  const navigate = useNavigate();
  const { supabase } = useAuth();
  const { tap, success, error: hapticError } = useHaptics();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    tap("medium");

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (err) {
      setError(err.message);
      hapticError();
    } else {
      setSent(true);
      success();
    }

    setLoading(false);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 bg-[var(--void)] safe-top safe-bottom">
      <button
        onClick={() => {
          hapticImpact("light");
          navigate("/login");
        }}
        className="absolute top-4 left-4 p-2 text-[var(--leather)] tap-highlight-none hover:text-[var(--parchment)] transition-colors"
      >
        <ArrowLeft size={20} />
      </button>

      {sent ? (
        <div className="w-full max-w-sm md:max-w-md text-center">
          <CheckCircle size={48} className="text-[var(--emerald)] mx-auto mb-4" />
          <h1 className="heading-display text-xl text-[var(--gold)] mb-2">Check your email</h1>
          <p className="text-sm text-[var(--leather)] mb-6">
            We've sent a password reset link to{" "}
            <span className="text-[var(--parchment)]">{email}</span>. Tap the link to set a new
            password.
          </p>
          <Button variant="secondary" className="w-full" onClick={() => navigate("/login")}>
            Back to Sign In
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-8 flex flex-col items-center">
            <div className="w-12 h-12 rounded-md bg-[var(--void-raised)] border border-[var(--bronze)] flex items-center justify-center mb-4">
              <Mail size={24} className="text-[var(--sun)]" />
            </div>
            <h1 className="heading-display text-2xl text-[var(--gold)]">Reset Password</h1>
            <p className="font-mono text-xs text-[var(--leather)] mt-2">$ passwd --reset</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-sm md:max-w-md space-y-4">
            <div>
              <label className="block font-mono text-[10px] text-[var(--leather)] uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-10 px-3 py-2 bg-[var(--void-input)] border border-[var(--bronze)] text-[var(--gold)] text-sm font-mono placeholder:text-[var(--leather)] rounded-md focus:outline-none focus:border-[var(--sun)] transition-all"
                required
                autoComplete="email"
              />
            </div>

            {error && (
              <div className="p-3 rounded-md bg-[var(--ruby)]/10 border border-[var(--ruby)]/30">
                <p className="font-mono text-xs text-[var(--ruby)]">$ error: {error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
              {loading ? "$ sending..." : "Send Reset Link"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
