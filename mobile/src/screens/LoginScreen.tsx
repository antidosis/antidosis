import { useState } from "react";
import { useAuth } from "@mobile/hooks/useAuth";
import { useHaptics } from "@mobile/hooks/useNative";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Zap } from "lucide-react";
import { hapticImpact } from "@mobile/lib/native";
import { Button } from "@mobile/components/ui";

/* ═══════════════════════════════════════════════════════════════
   LOGIN SCREEN — Terminal Authentication
   Boot-inspired login with monospace forms and CRT vibe.
   ═══════════════════════════════════════════════════════════════ */

export function LoginScreen() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { tap, error: hapticError } = useHaptics();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    tap("medium");

    const fn = isRegistering ? signUp : signIn;
    const { error: err } = await fn(email, password);

    if (err) {
      setError(err.message);
      hapticError();
    }

    setLoading(false);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 bg-[var(--void)] safe-top safe-bottom">
      {/* Brand */}
      <div className="mb-8 flex flex-col items-center">
        <div className="w-14 h-14 rounded-md bg-[var(--sun)] flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(245,166,35,0.3)]">
          <Zap size={28} className="text-[var(--void)]" strokeWidth={2.5} />
        </div>
        <h1 className="heading-display text-3xl text-[var(--gold)] tracking-tight">Antidosis</h1>
        <div className="flex items-center gap-1 mt-2">
          <p className="font-mono text-xs text-[var(--leather)]">$ ./authenticate.sh</p>
          <span className="inline-block w-2 h-4 bg-[var(--sun)] animate-blink ml-1" />
        </div>
      </div>

      {/* Form */}
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
            className="w-full h-10 px-3 py-2 bg-[var(--void-input)] border border-[var(--bronze)] text-[var(--gold)] text-sm font-mono placeholder:text-[var(--leather)] rounded-md focus:outline-none focus:border-[var(--sun)] focus:shadow-[0_0_12px_rgba(245,166,35,0.15)] transition-all"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block font-mono text-[10px] text-[var(--leather)] uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-10 px-3 py-2 pr-10 bg-[var(--void-input)] border border-[var(--bronze)] text-[var(--gold)] text-sm font-mono placeholder:text-[var(--leather)] rounded-md focus:outline-none focus:border-[var(--sun)] focus:shadow-[0_0_12px_rgba(245,166,35,0.15)] transition-all"
              required
              autoComplete={isRegistering ? "new-password" : "current-password"}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => {
                hapticImpact("light");
                setShowPassword(!showPassword);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--leather)] tap-highlight-none hover:text-[var(--parchment)] transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-[var(--ruby)]/10 border border-[var(--ruby)]/30">
            <p className="font-mono text-xs text-[var(--ruby)]">$ error: {error}</p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading} haptic={false}>
          {loading ? "$ authenticating..." : isRegistering ? "Create Account" : "Sign In"}
        </Button>

        {!isRegistering && (
          <button
            type="button"
            onClick={() => {
              hapticImpact("light");
              navigate("/forgot-password");
            }}
            className="w-full text-center font-mono text-xs text-[var(--leather)] hover:text-[var(--sun)] transition-colors tap-highlight-none"
          >
            Forgot password?
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            hapticImpact("light");
            setIsRegistering(!isRegistering);
            setError("");
          }}
          className="w-full text-center font-mono text-xs text-[var(--leather)] hover:text-[var(--parchment)] transition-colors tap-highlight-none"
        >
          {isRegistering ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>

        {/* Legal links */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => window.open("https://www.antidosis.com/privacy", "_blank")}
            className="font-mono text-[10px] text-[var(--leather)] hover:text-[var(--sun)] transition-colors tap-highlight-none"
          >
            Privacy Policy
          </button>
          <span className="text-[var(--bronze)] text-[10px]">|</span>
          <button
            type="button"
            onClick={() => window.open("https://www.antidosis.com/terms", "_blank")}
            className="font-mono text-[10px] text-[var(--leather)] hover:text-[var(--sun)] transition-colors tap-highlight-none"
          >
            Terms of Service
          </button>
        </div>
      </form>
    </div>
  );
}
