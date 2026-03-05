import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Key,
  Shield,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Puzzle,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "../stores/auth";

interface AuthStatus {
  configured: boolean;
  type: "oauth" | "apikey" | null;
}

export function Settings() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-xl mx-auto py-8 px-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link
            to="/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface-muted text-text-disabled hover:text-text-primary transition-all"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-[20px] font-bold text-text-primary tracking-tight">Settings</h1>
        </div>

        <ChangePasswordSection />
        <ClaudeAuthSection />
        <PluginsSection />
        <SessionSection onLogout={handleLogout} />
      </div>
    </div>
  );
}

/* ── Section wrapper ── */

function Section({ title, description, children, badge }: {
  title: string;
  description: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="panel overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold text-text-primary">{title}</h3>
          <p className="text-[12px] text-text-secondary mt-0.5">{description}</p>
        </div>
        {badge}
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

/* ── Change Password ── */

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setSuccess(false);

    if (newPassword.length < 6) { setError("New password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to change password");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch {
      setError("Connection failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Section title="Security" description="Update your admin password">
      <form onSubmit={handleSubmit} className="space-y-3">
        {[
          { id: "cur", label: "Current password", val: currentPassword, set: setCurrentPassword, ph: "Enter current password" },
          { id: "new", label: "New password", val: newPassword, set: setNewPassword, ph: "At least 6 characters" },
          { id: "cnf", label: "Confirm new password", val: confirmPassword, set: setConfirmPassword, ph: "Repeat new password" },
        ].map(({ id, label, val, set, ph }) => (
          <div key={id}>
            <label htmlFor={id} className="block text-[11px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
              {label}
            </label>
            <input
              id={id}
              type="password"
              value={val}
              onChange={(e) => set(e.target.value)}
              placeholder={ph}
              className="input"
            />
          </div>
        ))}

        {error && (
          <div className="flex items-center gap-2 text-[12px] text-danger">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-[12px] text-success">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>Password changed successfully</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
          className="btn btn-primary w-full py-2.5 text-[13px]"
        >
          {isSubmitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Update Password"}
        </button>
      </form>
    </Section>
  );
}

/* ── Claude Auth ── */

function ClaudeAuthSection() {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReconfigure, setShowReconfigure] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/settings/claude-auth/status", { credentials: "include" });
      if (res.ok) setStatus((await res.json()) as AuthStatus);
    } catch { /* silent */ } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleReconfigured = () => { setShowReconfigure(false); fetchStatus(); };

  const handleRefreshToken = async () => {
    setIsRefreshing(true);
    setRefreshMsg(null);
    try {
      const res = await fetch("/api/settings/claude-auth/refresh", { method: "POST", credentials: "include" });
      if (res.ok) {
        setRefreshMsg({ type: "success", text: "Token refreshed" });
        setTimeout(() => setRefreshMsg(null), 3000);
      } else {
        const data = (await res.json()) as { error?: string };
        setRefreshMsg({ type: "error", text: data.error ?? "Refresh failed" });
      }
    } catch {
      setRefreshMsg({ type: "error", text: "Connection failed" });
    } finally {
      setIsRefreshing(false);
    }
  };

  const badge = status?.configured ? (
    <span className="badge badge-success shrink-0">Active</span>
  ) : (
    <span className="badge badge-warning shrink-0">Not set</span>
  );

  return (
    <Section
      title="Claude Authentication"
      description={status?.configured
        ? `Connected via ${status.type === "oauth" ? "OAuth" : "API Key"}`
        : "Configure how Pulse connects to Claude"}
      badge={isLoading ? undefined : badge}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-text-disabled" />
        </div>
      ) : (
        <div className="space-y-3">
          {refreshMsg && (
            <div className={`flex items-center gap-2 text-[12px] ${refreshMsg.type === "success" ? "text-success" : "text-danger"}`}>
              {refreshMsg.type === "success"
                ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
              <span>{refreshMsg.text}</span>
            </div>
          )}
          {showReconfigure ? (
            <ReconfigureAuth onCancel={() => setShowReconfigure(false)} onComplete={handleReconfigured} />
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setShowReconfigure(true)}
                className="btn btn-secondary flex-1 py-2.5"
              >
                <Key className="h-3.5 w-3.5" />
                {status?.configured ? "Reconfigure" : "Configure"}
              </button>
              {status?.configured && status.type === "oauth" && (
                <button
                  onClick={handleRefreshToken}
                  disabled={isRefreshing}
                  className="btn btn-secondary px-4 py-2.5"
                  title="Refresh token"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

function ReconfigureAuth({ onCancel, onComplete }: { onCancel: () => void; onComplete: () => void }) {
  const [method, setMethod] = useState<"oauthtoken" | "apikey" | null>(null);

  if (method === "oauthtoken") return <OAuthTokenReconfigure onBack={() => setMethod(null)} onComplete={onComplete} />;
  if (method === "apikey") return <ApiKeyReconfigure onBack={() => setMethod(null)} onComplete={onComplete} />;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setMethod("oauthtoken")}
          className="panel-muted p-4 flex flex-col items-center gap-2 hover:border-border-strong transition-colors"
        >
          <Shield className="h-5 w-5 text-orange" />
          <span className="text-[12px] font-semibold text-text-primary">CLI Token</span>
        </button>
        <button
          onClick={() => setMethod("apikey")}
          className="panel-muted p-4 flex flex-col items-center gap-2 hover:border-border-strong transition-colors"
        >
          <Key className="h-5 w-5 text-text-secondary" />
          <span className="text-[12px] font-semibold text-text-primary">API Key</span>
        </button>
      </div>
      <button onClick={onCancel} className="w-full text-[12px] text-text-disabled hover:text-text-secondary transition-colors">
        Cancel
      </button>
    </div>
  );
}

function OAuthTokenReconfigure({ onBack, onComplete }: { onBack: () => void; onComplete: () => void }) {
  const [isImporting, setIsImporting] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [token, setToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAutoImport = async () => {
    setIsImporting(true); setError(null);
    try {
      const res = await fetch("/api/settings/import-cli-token", { method: "POST", credentials: "include" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to import"); setIsImporting(false); return;
      }
      setSuccess(true); setTimeout(onComplete, 1000);
    } catch { setError("Connection failed"); setIsImporting(false); }
  };

  const handleManualSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token.trim() || isSubmitting) return;
    setIsSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/settings/claude-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: "oauth", token: token.trim(), refreshToken: refreshToken.trim() || undefined }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to save"); setIsSubmitting(false); return;
      }
      setSuccess(true); setTimeout(onComplete, 1000);
    } catch { setError("Connection failed"); setIsSubmitting(false); }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-2 py-6">
        <CheckCircle2 className="h-9 w-9 text-success" />
        <p className="text-[13px] font-medium text-success">Token imported</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      <div className="rounded-lg border border-border bg-surface-muted px-3 py-2.5">
        <p className="text-[12px] text-text-secondary leading-relaxed">
          SSH into the server and run{" "}
          <code className="rounded bg-surface px-1.5 py-0.5 text-[11px] text-orange border border-border font-mono">claude login</code>,
          then click below.
        </p>
      </div>

      <button onClick={handleAutoImport} disabled={isImporting} className="btn btn-primary w-full py-2.5 text-[13px]">
        {isImporting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Import from CLI"}
      </button>

      {error && (
        <div className="flex items-center gap-2 text-[12px] text-danger">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /><span>{error}</span>
        </div>
      )}

      {!showManual ? (
        <button onClick={() => { setShowManual(true); setError(null); }} className="w-full text-[12px] text-text-disabled hover:text-text-secondary transition-colors">
          Or paste tokens manually
        </button>
      ) : (
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] text-text-disabled">manual</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          {[
            { id: "tok", label: "Access Token", val: token, set: setToken, ph: "sk-ant-oat01-…" },
            { id: "ref", label: "Refresh Token (optional)", val: refreshToken, set: setRefreshToken, ph: "sk-ant-ort01-…" },
          ].map(({ id, label, val, set, ph }) => (
            <div key={id}>
              <label htmlFor={id} className="block text-[11px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">{label}</label>
              <input id={id} type="password" value={val} onChange={(e) => set(e.target.value)} placeholder={ph} className="input" />
            </div>
          ))}
          <button type="submit" disabled={isSubmitting || !token.trim()} className="btn btn-secondary w-full py-2.5 text-[13px]">
            {isSubmitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Save Token"}
          </button>
        </form>
      )}
    </div>
  );
}

function ApiKeyReconfigure({ onBack, onComplete }: { onBack: () => void; onComplete: () => void }) {
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || isSubmitting) return;
    setIsSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/settings/claude-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: "apikey", token: apiKey.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed"); setIsSubmitting(false); return;
      }
      setSuccess(true); setTimeout(onComplete, 1000);
    } catch { setError("Connection failed"); setIsSubmitting(false); }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-2 py-6">
        <CheckCircle2 className="h-9 w-9 text-success" />
        <p className="text-[13px] font-medium text-success">API key saved</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="apikey" className="block text-[11px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
            Anthropic API Key
          </label>
          <input id="apikey" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-ant-…" className="input" />
        </div>
        {error && (
          <div className="flex items-center gap-2 text-[12px] text-danger">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /><span>{error}</span>
          </div>
        )}
        <button type="submit" disabled={isSubmitting || !apiKey.trim()} className="btn btn-primary w-full py-2.5 text-[13px]">
          {isSubmitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Save API Key"}
        </button>
      </form>
    </div>
  );
}

/* ── Plugins ── */

interface PluginInfo {
  name: string;
  marketplace: string;
  version: string;
  installedAt: string | null;
}

function PluginsSection() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/plugins", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { plugins: [] }))
      .then((data: { plugins: PluginInfo[] }) => setPlugins(data.plugins))
      .catch(() => setPlugins([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <Section title="Plugins" description="Installed Claude Code plugins">
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-text-disabled" />
        </div>
      ) : plugins.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Puzzle className="h-8 w-8 text-text-disabled" />
          <p className="text-[13px] text-text-secondary">No plugins detected</p>
          <p className="text-[12px] text-text-disabled">Install via Claude Code CLI on the server</p>
        </div>
      ) : (
        <div>
          {plugins.map((plugin) => (
            <div
              key={`${plugin.name}@${plugin.marketplace}`}
              className="data-row"
            >
              <div>
                <p className="text-[13px] font-semibold text-text-primary">{plugin.name}</p>
                <p className="text-[11px] text-text-secondary">{plugin.marketplace}</p>
              </div>
              <span className="badge badge-success">Active</span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ── Session ── */

function SessionSection({ onLogout }: { onLogout: () => void }) {
  return (
    <Section title="Session" description="Manage your current session">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-secondary">Signed in as admin</p>
        <button
          onClick={onLogout}
          className="btn btn-danger px-4 py-2"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </Section>
  );
}
