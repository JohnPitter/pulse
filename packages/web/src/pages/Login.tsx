import { useState, type FormEvent } from "react";
import { Lock, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "../stores/auth";

function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand/10 blur-[120px]" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand/8 blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-brand/5 blur-[100px]" />
    </div>
  );
}

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
    <div className="min-h-screen bg-neutral-bg1 flex items-center justify-center px-4 relative">
      <AmbientBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center rounded-2xl border border-stroke bg-neutral-bg2 backdrop-blur-sm p-3 mb-4">
            <span className="text-2xl font-bold text-brand">P</span>
          </div>
          <h1 className="text-3xl font-bold text-neutral-fg1 tracking-tight">
            Pulse
          </h1>
          <p className="text-sm text-neutral-fg2 mt-2">Remote Agent Manager</p>
          <p className="text-xs text-neutral-fg3 mt-3 max-w-[280px] mx-auto leading-relaxed">
            Manage Claude Code agents on your remote server from anywhere.
          </p>
        </div>

        <div className="rounded-xl border border-stroke bg-neutral-bg2 backdrop-blur-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-fg3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
                className="input-fluent w-full py-3 pl-10 pr-4"
              />
            </div>

            {error && (
              <p className="text-sm text-danger text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !password.trim()}
              className="btn-primary w-full py-3 text-sm"
            >
              {isSubmitting ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </motion.div>
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
    <div className="min-h-screen bg-neutral-bg1 flex items-center justify-center px-4 relative">
      <AmbientBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center rounded-full bg-brand-light p-3 mb-4">
            <ShieldCheck className="h-8 w-8 text-brand" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-fg1 tracking-tight">
            Welcome to Pulse
          </h1>
          <p className="text-sm text-neutral-fg2 mt-2 max-w-[300px] mx-auto leading-relaxed">
            Pulse lets you deploy and monitor Claude Code agents from your browser. Set an admin password to secure your instance.
          </p>
        </div>

        <div className="rounded-xl border border-stroke bg-neutral-bg2 backdrop-blur-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-fg3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create password (min. 6 characters)"
                autoFocus
                className="input-fluent w-full py-3 pl-10 pr-4"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-fg3" />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm password"
                className="input-fluent w-full py-3 pl-10 pr-4"
              />
            </div>

            {confirm && !passwordsMatch && (
              <p className="text-sm text-danger text-center">Passwords do not match</p>
            )}

            {error && (
              <p className="text-sm text-danger text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="btn-primary w-full py-3 text-sm"
            >
              {isSubmitting ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                "Create account"
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
