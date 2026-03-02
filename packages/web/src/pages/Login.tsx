import { useState, type FormEvent } from "react";
import { Lock, Loader2, ShieldCheck } from "lucide-react";
import { useAuthStore } from "../stores/auth";

export function Login() {
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error, login } = useAuthStore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const success = await login(password);
    if (!success) {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Pulse
          </h1>
          <p className="text-sm text-stone-400 mt-2">Remote Agent Manager</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
              className="w-full rounded-xl border border-stone-700 bg-stone-900 py-3 pl-10 pr-4 text-sm text-white placeholder-stone-500 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !password.trim()}
            className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-orange-600 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
          >
            {isSubmitting ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export function SetupPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error, setup } = useAuthStore();

  const passwordsMatch = password === confirm;
  const isValid = password.length >= 6 && passwordsMatch;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    const success = await setup(password);
    if (!success) {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center rounded-full bg-orange-500/10 p-3 mb-4">
            <ShieldCheck className="h-8 w-8 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Welcome to Pulse
          </h1>
          <p className="text-sm text-stone-400 mt-2">
            Set an admin password to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create password (min. 6 characters)"
              autoFocus
              className="w-full rounded-xl border border-stone-700 bg-stone-900 py-3 pl-10 pr-4 text-sm text-white placeholder-stone-500 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
              className="w-full rounded-xl border border-stone-700 bg-stone-900 py-3 pl-10 pr-4 text-sm text-white placeholder-stone-500 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
            />
          </div>

          {confirm && !passwordsMatch && (
            <p className="text-sm text-red-400 text-center">Passwords do not match</p>
          )}

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-orange-600 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
          >
            {isSubmitting ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              "Create account"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
