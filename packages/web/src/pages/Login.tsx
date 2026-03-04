import { useState, type FormEvent } from "react";
import { Cpu } from "lucide-react";
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
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-6">
      <div className="bg-neutral-bg2 border border-stroke rounded-2xl shadow-8 p-10 w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-brand flex items-center justify-center">
            <Cpu className="h-6 w-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-[22px] font-bold text-neutral-fg1 tracking-tight">Pulse</h1>
            <p className="text-[13px] text-neutral-fg2 mt-0.5">Multi-agent Claude orchestrator</p>
          </div>
        </div>

        <p className="text-[14px] font-medium text-neutral-fg2 mb-5 text-center">
          Sign in to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[12px] font-medium text-neutral-fg2 mb-1.5 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="input-fluent w-full"
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
            className="btn-primary w-full py-2.5 text-[14px] mt-1"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
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
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-6">
      <div className="bg-neutral-bg2 border border-stroke rounded-2xl shadow-8 p-10 w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-brand flex items-center justify-center">
            <Cpu className="h-6 w-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-[22px] font-bold text-neutral-fg1 tracking-tight">Pulse</h1>
            <p className="text-[13px] text-neutral-fg2 mt-0.5">Multi-agent Claude orchestrator</p>
          </div>
        </div>

        <p className="text-[14px] font-medium text-neutral-fg2 mb-5 text-center">
          Create your admin password
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[12px] font-medium text-neutral-fg2 mb-1.5 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="input-fluent w-full"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-neutral-fg2 mb-1.5 block">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
              className="input-fluent w-full"
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
            className="btn-primary w-full py-2.5 text-[14px] mt-1"
          >
            {isSubmitting ? "Setting up..." : "Set Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
