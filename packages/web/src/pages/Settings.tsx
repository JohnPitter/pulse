import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Lock,
  Key,
  Shield,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Puzzle,
  LogOut,
} from "lucide-react";
import { GlassCard } from "../components/common/GlassCard";
import { useAuthStore } from "../stores/auth";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

interface AuthStatus {
  configured: boolean;
  type: "oauth" | "apikey" | null;
}

// --------------------------------------------------------------------------
// Settings (main page)
// --------------------------------------------------------------------------

export function Settings() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-neutral-bg1 text-neutral-fg1">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-stroke bg-neutral-bg1/80 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="rounded-lg p-1.5 text-neutral-fg2 transition-colors duration-200 hover:text-neutral-fg1"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold tracking-tight">Settings</h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-6 p-4">
        <ChangePasswordSection />
        <ClaudeAuthSection />
        <PluginsSection />
        <SessionSection onLogout={handleLogout} />
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Change Password Section
// --------------------------------------------------------------------------

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

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

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
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Connection failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-lg bg-neutral-bg3 p-2">
          <Lock className="h-4 w-4 text-neutral-fg2" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Change Password</h2>
          <p className="text-xs text-neutral-fg3">Update your admin password</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="current-password" className="block text-xs text-neutral-fg2 mb-1.5">
            Current password
          </label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            className="input-fluent w-full"
          />
        </div>

        <div>
          <label htmlFor="new-password" className="block text-xs text-neutral-fg2 mb-1.5">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="input-fluent w-full"
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-xs text-neutral-fg2 mb-1.5">
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            className="input-fluent w-full"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-danger">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>Password changed successfully</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
          className="btn-primary w-full py-2.5 text-sm"
        >
          {isSubmitting ? (
            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
          ) : (
            "Update Password"
          )}
        </button>
      </form>
    </GlassCard>
  );
}

// --------------------------------------------------------------------------
// Claude Auth Section
// --------------------------------------------------------------------------

function ClaudeAuthSection() {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReconfigure, setShowReconfigure] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/settings/claude-auth/status", {
        credentials: "include",
      });
      if (res.ok) {
        const data = (await res.json()) as AuthStatus;
        setStatus(data);
      }
    } catch {
      // Silent fail — status remains null
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleReconfigured = () => {
    setShowReconfigure(false);
    fetchStatus();
  };

  const handleRefreshToken = async () => {
    setIsRefreshing(true);
    setRefreshMsg(null);
    try {
      const res = await fetch("/api/settings/claude-auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setRefreshMsg({ type: "success", text: "Token refreshed successfully" });
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

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-fg3" />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-lg bg-neutral-bg3 p-2">
          <Shield className="h-4 w-4 text-neutral-fg2" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold">Claude Authentication</h2>
          <p className="text-xs text-neutral-fg3">
            {status?.configured
              ? `Connected via ${status.type === "oauth" ? "OAuth" : "API Key"}`
              : "Not configured"}
          </p>
        </div>
        {status?.configured && (
          <span className="badge badge-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
            Active
          </span>
        )}
        {!status?.configured && (
          <span className="badge badge-warning">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />
            Not set
          </span>
        )}
      </div>

      {refreshMsg && (
        <div className={`flex items-center gap-2 text-sm mb-3 ${refreshMsg.type === "success" ? "text-success" : "text-danger"}`}>
          {refreshMsg.type === "success" ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          )}
          <span>{refreshMsg.text}</span>
        </div>
      )}

      {showReconfigure ? (
        <ReconfigureAuth
          onCancel={() => setShowReconfigure(false)}
          onComplete={handleReconfigured}
        />
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => setShowReconfigure(true)}
            className="btn-secondary flex flex-1 items-center justify-center gap-2 py-2.5 text-sm"
          >
            <Key className="h-3.5 w-3.5" />
            {status?.configured ? "Reconfigure" : "Configure"}
          </button>
          {status?.configured && status.type === "oauth" && (
            <button
              onClick={handleRefreshToken}
              disabled={isRefreshing}
              className="btn-secondary flex items-center justify-center gap-2 px-4 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh OAuth token"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>
      )}
    </GlassCard>
  );
}

// --------------------------------------------------------------------------
// Reconfigure Auth (inline form)
// --------------------------------------------------------------------------

function ReconfigureAuth({
  onCancel,
  onComplete,
}: {
  onCancel: () => void;
  onComplete: () => void;
}) {
  const [method, setMethod] = useState<"oauthtoken" | "apikey" | null>(null);

  if (method === "oauthtoken") {
    return <OAuthTokenReconfigure onBack={() => setMethod(null)} onComplete={onComplete} />;
  }

  if (method === "apikey") {
    return <ApiKeyReconfigure onBack={() => setMethod(null)} onComplete={onComplete} />;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setMethod("oauthtoken")}
          className="flex flex-col items-center gap-2 rounded-xl border border-stroke bg-neutral-bg3 p-4 text-center transition-all duration-200 hover:bg-neutral-bg-hover hover:border-[var(--card-hover-border)] active:scale-[0.98]"
        >
          <Shield className="h-5 w-5 text-brand" />
          <span className="text-xs font-medium text-neutral-fg1">CLI Token</span>
        </button>
        <button
          onClick={() => setMethod("apikey")}
          className="flex flex-col items-center gap-2 rounded-xl border border-stroke bg-neutral-bg3 p-4 text-center transition-all duration-200 hover:bg-neutral-bg-hover hover:border-[var(--card-hover-border)] active:scale-[0.98]"
        >
          <Key className="h-5 w-5 text-neutral-fg2" />
          <span className="text-xs font-medium text-neutral-fg1">API Key</span>
        </button>
      </div>
      <button
        onClick={onCancel}
        className="w-full text-xs text-neutral-fg3 transition-colors duration-200 hover:text-neutral-fg2"
      >
        Cancel
      </button>
    </div>
  );
}

// --------------------------------------------------------------------------
// CLI Token Import
// --------------------------------------------------------------------------

function OAuthTokenReconfigure({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: () => void;
}) {
  const [isImporting, setIsImporting] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [token, setToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAutoImport = async () => {
    setIsImporting(true);
    setError(null);

    try {
      const res = await fetch("/api/settings/import-cli-token", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to import");
        setIsImporting(false);
        return;
      }

      setSuccess(true);
      setTimeout(onComplete, 1000);
    } catch {
      setError("Connection failed");
      setIsImporting(false);
    }
  };

  const handleManualSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/settings/claude-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: "oauth",
          token: token.trim(),
          refreshToken: refreshToken.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to save token");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(onComplete, 1000);
    } catch {
      setError("Connection failed");
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CheckCircle2 className="h-10 w-10 text-success" />
        <p className="text-sm font-medium">Token imported successfully</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-neutral-fg2 transition-colors duration-200 hover:text-neutral-fg1"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <div className="rounded-lg border border-stroke bg-neutral-bg3 p-3">
        <p className="text-xs text-neutral-fg2 leading-relaxed">
          SSH into the server and run{" "}
          <code className="rounded bg-neutral-bg-hover px-1.5 py-0.5 text-[11px] text-brand">
            claude login
          </code>
          , then click the button below to auto-import.
        </p>
      </div>

      <button
        onClick={handleAutoImport}
        disabled={isImporting}
        className="btn-primary w-full py-2.5 text-sm"
      >
        {isImporting ? (
          <Loader2 className="mx-auto h-4 w-4 animate-spin" />
        ) : (
          "Import from CLI"
        )}
      </button>

      {error && (
        <div className="flex items-center gap-2 text-sm text-danger">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!showManual ? (
        <button
          onClick={() => { setShowManual(true); setError(null); }}
          className="w-full text-xs text-neutral-fg3 transition-colors duration-200 hover:text-neutral-fg2"
        >
          Or paste tokens manually
        </button>
      ) : (
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-stroke" />
            <span className="text-xs text-neutral-fg3">manual paste</span>
            <div className="h-px flex-1 bg-stroke" />
          </div>

          <div>
            <label htmlFor="oauth-token" className="block text-xs text-neutral-fg2 mb-1.5">
              Access Token
            </label>
            <input
              id="oauth-token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="sk-ant-oat01-..."
              className="input-fluent w-full"
            />
          </div>

          <div>
            <label htmlFor="oauth-refresh" className="block text-xs text-neutral-fg2 mb-1.5">
              Refresh Token <span className="text-neutral-fg-disabled">(optional)</span>
            </label>
            <input
              id="oauth-refresh"
              type="password"
              value={refreshToken}
              onChange={(e) => setRefreshToken(e.target.value)}
              placeholder="sk-ant-ort01-..."
              className="input-fluent w-full"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !token.trim()}
            className="btn-secondary w-full py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              "Save Token"
            )}
          </button>
        </form>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// API Key Reconfigure
// --------------------------------------------------------------------------

function ApiKeyReconfigure({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: () => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/settings/claude-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: "apikey", token: apiKey.trim() }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to save API key");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(onComplete, 1000);
    } catch {
      setError("Connection failed");
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CheckCircle2 className="h-10 w-10 text-success" />
        <p className="text-sm font-medium">API key saved successfully</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-neutral-fg2 transition-colors duration-200 hover:text-neutral-fg1"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="apikey-settings" className="block text-xs text-neutral-fg2 mb-1.5">
            Anthropic API Key
          </label>
          <input
            id="apikey-settings"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="input-fluent w-full"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-danger">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !apiKey.trim()}
          className="btn-primary w-full py-2.5 text-sm"
        >
          {isSubmitting ? (
            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
          ) : (
            "Save API Key"
          )}
        </button>
      </form>
    </div>
  );
}

// --------------------------------------------------------------------------
// Plugins Section
// --------------------------------------------------------------------------

function PluginsSection() {
  const [plugins, setPlugins] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/plugins", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { plugins: [] }))
      .then((data: { plugins: string[] }) => setPlugins(data.plugins))
      .catch(() => setPlugins([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-lg bg-neutral-bg3 p-2">
          <Puzzle className="h-4 w-4 text-neutral-fg2" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Claude Code Plugins</h2>
          <p className="text-xs text-neutral-fg3">Extensions installed on the server</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-fg3" />
        </div>
      ) : plugins.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Puzzle className="h-8 w-8 text-neutral-fg-disabled" />
          <p className="text-sm text-neutral-fg3">No plugins detected</p>
          <p className="text-xs text-neutral-fg-disabled">
            Install plugins via Claude Code CLI on the server
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {plugins.map((name) => (
            <div
              key={name}
              className="flex items-center gap-3 rounded-lg border border-stroke bg-neutral-bg3 px-3 py-2.5"
            >
              <Puzzle className="h-4 w-4 text-brand shrink-0" />
              <span className="text-sm text-neutral-fg1 truncate">{name}</span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

// --------------------------------------------------------------------------
// Session Section
// --------------------------------------------------------------------------

function SessionSection({ onLogout }: { onLogout: () => void }) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Session</h2>
          <p className="text-xs text-neutral-fg3 mt-1">
            Signed in as admin
          </p>
        </div>
        <button
          onClick={onLogout}
          className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm text-danger transition-colors duration-200 hover:bg-danger/10"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </GlassCard>
  );
}
