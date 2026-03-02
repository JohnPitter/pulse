import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
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
  ExternalLink,
  ClipboardPaste,
} from "lucide-react";

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

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-stone-800 bg-stone-950/80 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="rounded-lg p-1.5 text-stone-400 transition-colors duration-200 hover:text-white"
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
    <section className="rounded-xl border border-stone-800 bg-stone-900 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-lg bg-stone-800 p-2">
          <Lock className="h-4 w-4 text-stone-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Change Password</h2>
          <p className="text-xs text-stone-500">Update your admin password</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="current-password" className="block text-xs text-stone-400 mb-1.5">
            Current password
          </label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            className="w-full rounded-lg border border-stone-700 bg-stone-800 py-2.5 px-3 text-sm text-white placeholder-stone-500 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
          />
        </div>

        <div>
          <label htmlFor="new-password" className="block text-xs text-stone-400 mb-1.5">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full rounded-lg border border-stone-700 bg-stone-800 py-2.5 px-3 text-sm text-white placeholder-stone-500 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-xs text-stone-400 mb-1.5">
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            className="w-full rounded-lg border border-stone-700 bg-stone-800 py-2.5 px-3 text-sm text-white placeholder-stone-500 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>Password changed successfully</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
          className="w-full rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-orange-600 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
        >
          {isSubmitting ? (
            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
          ) : (
            "Update Password"
          )}
        </button>
      </form>
    </section>
  );
}

// --------------------------------------------------------------------------
// Claude Auth Section
// --------------------------------------------------------------------------

function ClaudeAuthSection() {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReconfigure, setShowReconfigure] = useState(false);

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

  if (isLoading) {
    return (
      <section className="rounded-xl border border-stone-800 bg-stone-900 p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-stone-500" />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-stone-800 bg-stone-900 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-lg bg-stone-800 p-2">
          <Shield className="h-4 w-4 text-stone-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold">Claude Authentication</h2>
          <p className="text-xs text-stone-500">
            {status?.configured
              ? `Connected via ${status.type === "oauth" ? "OAuth" : "API Key"}`
              : "Not configured"}
          </p>
        </div>
        {status?.configured && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
            Active
          </span>
        )}
        {!status?.configured && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs text-yellow-400">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" aria-hidden="true" />
            Not set
          </span>
        )}
      </div>

      {showReconfigure ? (
        <ReconfigureAuth
          onCancel={() => setShowReconfigure(false)}
          onComplete={handleReconfigured}
        />
      ) : (
        <button
          onClick={() => setShowReconfigure(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-700 bg-stone-800 py-2.5 text-sm text-stone-300 transition-all duration-200 hover:bg-stone-700 hover:text-white active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {status?.configured ? "Reconfigure" : "Configure"}
        </button>
      )}
    </section>
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
  const [method, setMethod] = useState<"oauth" | "apikey" | null>(null);

  if (method === "oauth") {
    return <OAuthReconfigure onBack={() => setMethod(null)} onComplete={onComplete} />;
  }

  if (method === "apikey") {
    return <ApiKeyReconfigure onBack={() => setMethod(null)} onComplete={onComplete} />;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setMethod("oauth")}
          className="flex flex-col items-center gap-2 rounded-xl border border-stone-700 bg-stone-800 p-4 text-center transition-all duration-200 hover:bg-stone-700 hover:border-stone-600 active:scale-[0.98]"
        >
          <Key className="h-5 w-5 text-orange-500" />
          <span className="text-xs font-medium text-white">OAuth</span>
        </button>
        <button
          onClick={() => setMethod("apikey")}
          className="flex flex-col items-center gap-2 rounded-xl border border-stone-700 bg-stone-800 p-4 text-center transition-all duration-200 hover:bg-stone-700 hover:border-stone-600 active:scale-[0.98]"
        >
          <Key className="h-5 w-5 text-stone-400" />
          <span className="text-xs font-medium text-white">API Key</span>
        </button>
      </div>
      <button
        onClick={onCancel}
        className="w-full text-xs text-stone-500 transition-colors duration-200 hover:text-stone-300"
      >
        Cancel
      </button>
    </div>
  );
}

// --------------------------------------------------------------------------
// OAuth Reconfigure
// --------------------------------------------------------------------------

function OAuthReconfigure({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: () => void;
}) {
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUrl, setIsLoadingUrl] = useState(true);
  const [isWaiting, setIsWaiting] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detect server port from current URL
  const serverPort = window.location.port || "3000";

  // Poll auth status to detect when callback completes
  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/settings/claude-auth/status", {
          credentials: "include",
        });
        if (res.ok) {
          const data = (await res.json()) as { configured: boolean };
          if (data.configured) {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setSuccess(true);
            setTimeout(onComplete, 1000);
          }
        }
      } catch {
        // Silent — keep polling
      }
    }, 2000);
  }, [onComplete]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Fetch OAuth URL on mount
  useEffect(() => {
    const fetchUrl = async () => {
      try {
        const res = await fetch(`/api/settings/oauth-url?port=${serverPort}`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = (await res.json()) as { url: string };
          setOauthUrl(data.url);
        }
      } catch {
        setError("Failed to generate OAuth URL");
      } finally {
        setIsLoadingUrl(false);
      }
    };
    fetchUrl();
  }, [serverPort]);

  // Open OAuth in new tab and start polling
  const handleOpenAuth = () => {
    if (!oauthUrl) return;
    window.open(oauthUrl, "_blank");
    setIsWaiting(true);
    startPolling();
    // Show fallback after 15 seconds
    setTimeout(() => setShowFallback(true), 15000);
  };

  // Manual fallback: paste redirect URL
  const handleFallbackSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!redirectUrl.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/settings/oauth-exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ redirectUrl: redirectUrl.trim() }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to exchange code");
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
        <CheckCircle2 className="h-10 w-10 text-green-500" />
        <p className="text-sm font-medium">Connected successfully</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-stone-400 transition-colors duration-200 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      {isLoadingUrl ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-stone-500" />
        </div>
      ) : !isWaiting ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-xs text-stone-400 text-center max-w-[280px]">
            Click the button below to authorize with Claude. A new tab will open for you to log in and approve access.
          </p>
          <button
            onClick={handleOpenAuth}
            disabled={!oauthUrl}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-orange-600 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
          >
            <ExternalLink className="h-4 w-4" />
            Authorize with Claude
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          <p className="text-sm text-stone-300">Waiting for authorization...</p>
          <p className="text-xs text-stone-500 text-center">
            Complete the login in the other tab. This page will update automatically.
          </p>
        </div>
      )}

      {/* Fallback: paste redirect URL (shown after timeout or manually) */}
      {isWaiting && (
        <div className="space-y-3">
          {!showFallback && (
            <button
              onClick={() => setShowFallback(true)}
              className="w-full text-xs text-stone-500 transition-colors duration-200 hover:text-stone-300"
            >
              Having trouble? Click here for manual setup
            </button>
          )}

          {showFallback && (
            <>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-stone-800" />
                <span className="flex items-center gap-1.5 text-xs text-stone-500">
                  <ClipboardPaste className="h-3 w-3" />
                  manual fallback
                </span>
                <div className="h-px flex-1 bg-stone-800" />
              </div>

              <p className="text-xs text-stone-500 text-center">
                If the redirect failed, copy the full URL from your browser address bar and paste it below.
              </p>

              <form onSubmit={handleFallbackSubmit} className="space-y-3">
                <input
                  type="text"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  placeholder="http://localhost:3000/api/oauth/callback?code=..."
                  className="w-full rounded-lg border border-stone-700 bg-stone-800 py-2.5 px-3 text-sm text-white placeholder-stone-500 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
                />

                <button
                  type="submit"
                  disabled={isSubmitting || !redirectUrl.trim()}
                  className="w-full rounded-xl border border-stone-700 bg-stone-800 py-2.5 text-sm text-stone-300 transition-all duration-200 hover:bg-stone-700 hover:text-white active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
                >
                  {isSubmitting ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    "Exchange Code"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
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
        <CheckCircle2 className="h-10 w-10 text-green-500" />
        <p className="text-sm font-medium">API key saved successfully</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-stone-400 transition-colors duration-200 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="apikey-settings" className="block text-xs text-stone-400 mb-1.5">
            Anthropic API Key
          </label>
          <input
            id="apikey-settings"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full rounded-lg border border-stone-700 bg-stone-800 py-2.5 px-3 text-sm text-white placeholder-stone-500 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !apiKey.trim()}
          className="w-full rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-orange-600 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
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
// Plugins Section (read-only placeholder)
// --------------------------------------------------------------------------

function PluginsSection() {
  return (
    <section className="rounded-xl border border-stone-800 bg-stone-900 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-lg bg-stone-800 p-2">
          <Puzzle className="h-4 w-4 text-stone-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Installed Plugins</h2>
          <p className="text-xs text-stone-500">Manage your extensions</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <Puzzle className="h-8 w-8 text-stone-700" />
        <p className="text-sm text-stone-500">No plugins installed</p>
        <p className="text-xs text-stone-600">Plugin support coming soon</p>
      </div>
    </section>
  );
}
