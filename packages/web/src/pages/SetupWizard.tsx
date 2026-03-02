import { useState, type FormEvent } from "react";
import { Scan, Key, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";

type AuthMethod = null | "oauth" | "apikey";

export function SetupWizard() {
  const navigate = useNavigate();
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null);

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Setup
          </h1>
          <p className="text-sm text-stone-400 mt-2">
            Connect your Claude account
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-1.5 w-8 rounded-full bg-orange-500" />
          <div
            className={`h-1.5 w-8 rounded-full transition-colors duration-200 ${
              authMethod ? "bg-orange-500" : "bg-stone-700"
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
        className="w-full rounded-xl border border-stone-800 bg-stone-900 p-6 text-left transition-all duration-200 hover:shadow-md hover:border-stone-600 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
      >
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-orange-500/10 p-2.5">
            <Scan className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">OAuth</span>
              <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-xs text-orange-400">
                Recommended
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Scan a QR code or paste a token to authenticate with Claude
            </p>
          </div>
        </div>
      </button>

      <button
        onClick={() => onSelect("apikey")}
        className="w-full rounded-xl border border-stone-800 bg-stone-900 p-6 text-left transition-all duration-200 hover:shadow-md hover:border-stone-600 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
      >
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-stone-800 p-2.5">
            <Key className="h-5 w-5 text-stone-400" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white">API Key</span>
            <p className="text-xs text-stone-400 mt-1">
              Enter your Anthropic API key starting with sk-ant-...
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
        className="flex items-center gap-1.5 text-sm text-stone-400 transition-colors duration-200 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {success ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <p className="text-sm font-medium text-white">
            Connected successfully
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-xl border border-stone-800 bg-white p-4">
              <QRCodeSVG value={oauthUrl} size={180} />
            </div>
            <p className="text-xs text-stone-500 text-center">
              Scan with your phone or paste the token below
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-stone-800" />
            <span className="text-xs text-stone-500">or paste token</span>
            <div className="h-px flex-1 bg-stone-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste OAuth token here"
              className="w-full rounded-xl border border-stone-700 bg-stone-900 py-3 px-4 text-sm text-white placeholder-stone-500 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
            />

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !token.trim()}
              className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-orange-600 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
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
        className="flex items-center gap-1.5 text-sm text-stone-400 transition-colors duration-200 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {success ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <p className="text-sm font-medium text-white">
            API key validated successfully
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="apikey-input"
              className="block text-xs text-stone-400 mb-2"
            >
              Anthropic API Key
            </label>
            <input
              id="apikey-input"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full rounded-xl border border-stone-700 bg-stone-900 py-3 px-4 text-sm text-white placeholder-stone-500 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !apiKey.trim()}
            className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-orange-600 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
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
