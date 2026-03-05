import { useState, type FormEvent } from "react";
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
    if (!success) setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-[340px]">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="h-9 w-9 rounded-xl bg-orange flex items-center justify-center">
            <span className="text-[15px] font-bold text-white">P</span>
          </div>
          <div>
            <p className="text-[16px] font-bold text-text-primary tracking-tight">Pulse</p>
            <p className="text-[11px] text-text-disabled">Multi-agent Claude orchestrator</p>
          </div>
        </div>

        <div className="panel p-8">
          <h1 className="text-[20px] font-bold text-text-primary tracking-tight mb-1">Sign in</h1>
          <p className="text-[13px] text-text-secondary mb-6">Enter your admin password to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-[12px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
                autoFocus
                required
              />
            </div>

            {error && (
              <p className="text-[12px] text-danger">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !password.trim()}
              className="btn btn-primary w-full py-2.5 text-[13px] font-semibold"
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
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
    if (!success) setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-[340px]">
        <div className="flex items-center gap-3 mb-10">
          <div className="h-9 w-9 rounded-xl bg-orange flex items-center justify-center">
            <span className="text-[15px] font-bold text-white">P</span>
          </div>
          <div>
            <p className="text-[16px] font-bold text-text-primary tracking-tight">Pulse</p>
            <p className="text-[11px] text-text-disabled">Setup</p>
          </div>
        </div>

        <div className="panel p-8">
          <h1 className="text-[20px] font-bold text-text-primary tracking-tight mb-1">Create password</h1>
          <p className="text-[13px] text-text-secondary mb-6">Set an admin password for this instance.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-[12px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="input"
                autoFocus
                required
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-[12px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
                Confirm
              </label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                className="input"
                required
              />
            </div>

            {confirm && !passwordsMatch && (
              <p className="text-[12px] text-danger">Passwords do not match</p>
            )}
            {error && (
              <p className="text-[12px] text-danger">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="btn btn-primary w-full py-2.5 text-[13px] font-semibold"
            >
              {isSubmitting ? "Setting up…" : "Set Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
