import { useState, type FormEvent } from "react";
import { Scan, Key, ArrowLeft, Loader2, CheckCircle2, Info } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";

type AuthMethod = null | "oauth" | "apikey";

export function SetupWizard() {
  const navigate = useNavigate();
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null);

  return (
    <div className="min-h-screen bg-neutral-bg1 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-fg1 tracking-tight">
            Setup
          </h1>
          <p className="text-sm text-neutral-fg2 mt-2">
            Connect your Claude account
          </p>
        </div>

        {/* Info box */}
        <div className="flex items-start gap-2.5 rounded-lg border border-stroke bg-neutral-bg2 p-3 mb-6">
          <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
          <p className="text-xs text-neutral-fg2 leading-relaxed">
            Connect a Claude account so Pulse can create and manage agents on your behalf. You can change this later in Settings.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-1.5 w-8 rounded-full bg-brand" />
          <div
            className={`h-1.5 w-8 rounded-full transition-colors duration-200 ${
              authMethod ? "bg-brand" : "bg-neutral-fg-disabled"
            }`}
          />
        </div>

        {authMethod === null && (
          <MethodSelection onSelect={setAuthMethod} />
        )}

        {authMethod === "oauth" && (
          <OAuthSetup
            onBack={() => setAuthMethod(null)}
            onComplete={() => navigate("/")}
          />
        )}

        {authMethod === "apikey" && (
          <ApiKeySetup
            onBack={() => setAuthMethod(null)}
            onComplete={() => navigate("/")}
          />
        )}
      </div>
    </div>
  );
}

function MethodSelection({
  onSelect,
}: {
  onSelect: (method: AuthMethod) => void;
}) {
  return (
    <div className="space-y-4">
      <button
        onClick={() => onSelect("oauth")}
        className="card-interactive w-full p-6 text-left"
      >
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-brand-light p-2.5">
            <Scan className="h-5 w-5 text-brand" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-fg1">OAuth</span>
              <span className="badge badge-primary">
                Recommended
              </span>
            </div>
            <p className="text-xs text-neutral-fg2 mt-1">
              Use your existing Claude session. Scan the QR code from a device where you're logged into Claude, or paste an OAuth token.
            </p>
          </div>
        </div>
      </button>

      <button
        onClick={() => onSelect("apikey")}
        className="card-interactive w-full p-6 text-left"
      >
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-neutral-bg3 p-2.5">
            <Key className="h-5 w-5 text-neutral-fg2" />
          </div>
          <div>
            <span className="text-sm font-semibold text-neutral-fg1">API Key</span>
            <p className="text-xs text-neutral-fg2 mt-1">
              Use a direct API key from console.anthropic.com. Gives full control but uses your API credits directly.
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}

function OAuthSetup({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: () => void;
}) {
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/setup/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: token.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to validate token");
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

  // Placeholder URL for QR code — will be replaced with real OAuth URL
  const oauthUrl = `${window.location.origin}/api/setup/oauth/start`;

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-neutral-fg2 transition-colors duration-200 hover:text-neutral-fg1"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {success ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <CheckCircle2 className="h-12 w-12 text-success" />
          <p className="text-sm font-medium text-neutral-fg1">
            Connected successfully
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-xl border border-stroke bg-white p-4">
              <QRCodeSVG value={oauthUrl} size={180} />
            </div>
            <p className="text-xs text-neutral-fg3 text-center">
              Scan with your phone or paste the token below
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-stroke" />
            <span className="text-xs text-neutral-fg3">or paste token</span>
            <div className="h-px flex-1 bg-stroke" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste OAuth token here"
              className="input-fluent w-full py-3"
            />

            {error && (
              <p className="text-sm text-danger text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !token.trim()}
              className="btn-primary w-full py-3 text-sm"
            >
              {isSubmitting ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                "Continue"
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

function ApiKeySetup({
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
      const res = await fetch("/api/setup/apikey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Invalid API key");
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

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-neutral-fg2 transition-colors duration-200 hover:text-neutral-fg1"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {success ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <CheckCircle2 className="h-12 w-12 text-success" />
          <p className="text-sm font-medium text-neutral-fg1">
            API key validated successfully
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="apikey-input"
              className="block text-xs text-neutral-fg2 mb-2"
            >
              Anthropic API Key
            </label>
            <input
              id="apikey-input"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="input-fluent w-full py-3"
            />
          </div>

          {error && (
            <p className="text-sm text-danger text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !apiKey.trim()}
            className="btn-primary w-full py-3 text-sm"
          >
            {isSubmitting ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              "Continue"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
