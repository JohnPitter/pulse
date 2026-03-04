import { Fragment, useState, type FormEvent } from "react";
import { ArrowLeft, Check, CheckCircle2, Cpu, Key, Loader2, Scan } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";

type AuthMethod = null | "oauth" | "apikey";

const STEPS = ["Method", "Authenticate"];

export function SetupWizard() {
  const navigate = useNavigate();
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null);

  const currentStep = authMethod === null ? 0 : 1;

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-6">
      <div className="bg-neutral-bg2 border border-stroke rounded-2xl shadow-lg w-full max-w-lg overflow-hidden">
        {/* Step indicator header */}
        <div className="px-8 pt-8 pb-6 border-b border-stroke">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center">
              <Cpu className="h-4 w-4 text-white" />
            </div>
            <span className="text-[18px] font-bold text-neutral-fg1 tracking-tight">
              Pulse Setup
            </span>
          </div>

          {/* Steps */}
          <div className="flex items-center">
            {STEPS.map((step, i) => (
              <Fragment key={step}>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-all ${
                      i < currentStep
                        ? "bg-brand text-white"
                        : i === currentStep
                          ? "bg-brand text-white ring-4 ring-brand/20"
                          : "bg-neutral-bg3 text-neutral-fg3 border border-stroke"
                    }`}
                  >
                    {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span
                    className={`text-[11px] font-medium ${
                      i <= currentStep ? "text-neutral-fg2" : "text-neutral-fg3"
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-3 mb-5 transition-colors ${
                      i < currentStep ? "bg-brand" : "bg-stroke"
                    }`}
                  />
                )}
              </Fragment>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="px-8 py-6">
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
    </div>
  );
}

function MethodSelection({
  onSelect,
}: {
  onSelect: (method: AuthMethod) => void;
}) {
  const [selected, setSelected] = useState<AuthMethod>(null);

  const handleSelect = (method: "oauth" | "apikey") => {
    setSelected(method);
  };

  const handleContinue = () => {
    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-[20px] font-bold text-neutral-fg1 tracking-tight">
          Connect to Claude
        </h2>
        <p className="text-[14px] text-neutral-fg2 mt-1">
          Choose how you want to authenticate
        </p>
      </div>

      <button
        onClick={() => handleSelect("oauth")}
        className={`w-full text-left rounded-xl p-4 border-2 transition-all duration-150 ${
          selected === "oauth"
            ? "border-brand bg-brand-light"
            : "border-stroke bg-neutral-bg3 hover:border-neutral-fg3"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-brand-light p-2">
            <Scan className="h-4 w-4 text-brand" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-neutral-fg1">
              Claude OAuth
            </p>
            <p className="text-[12px] text-neutral-fg2 mt-0.5">
              Use your Claude account (recommended)
            </p>
          </div>
        </div>
      </button>

      <button
        onClick={() => handleSelect("apikey")}
        className={`w-full text-left rounded-xl p-4 border-2 transition-all duration-150 ${
          selected === "apikey"
            ? "border-brand bg-brand-light"
            : "border-stroke bg-neutral-bg3 hover:border-neutral-fg3"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-neutral-bg3 border border-stroke p-2">
            <Key className="h-4 w-4 text-neutral-fg2" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-neutral-fg1">
              API Key
            </p>
            <p className="text-[12px] text-neutral-fg2 mt-0.5">
              Use an Anthropic API key directly
            </p>
          </div>
        </div>
      </button>

      <button
        disabled={!selected}
        onClick={handleContinue}
        className="btn-primary w-full py-2.5 text-[14px] mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
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

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <CheckCircle2 className="h-12 w-12 text-success" />
        <p className="text-[14px] font-medium text-neutral-fg1">
          Connected successfully
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-[20px] font-bold text-neutral-fg1 tracking-tight">
          Scan QR Code
        </h2>
        <p className="text-[13px] text-neutral-fg2 mt-1">
          Open Claude app and scan to authenticate
        </p>
      </div>

      {/* QR code */}
      <div className="flex justify-center py-2">
        <div className="bg-white p-4 rounded-xl border border-stroke inline-block">
          <QRCodeSVG value={oauthUrl} size={180} />
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-stroke" />
        <span className="text-[11px] text-neutral-fg3">or paste token</span>
        <div className="h-px flex-1 bg-stroke" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste OAuth token here"
          className="input-fluent w-full"
        />

        {error && (
          <p className="text-[12px] text-danger">{error}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !token.trim()}
          className="btn-primary w-full py-2.5 text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
          ) : (
            "Complete Setup"
          )}
        </button>
      </form>

      <button
        onClick={onBack}
        className="flex items-center justify-center gap-1.5 w-full text-[13px] text-neutral-fg2 transition-colors duration-200 hover:text-neutral-fg1 pt-1"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>
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

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <CheckCircle2 className="h-12 w-12 text-success" />
        <p className="text-[14px] font-medium text-neutral-fg1">
          API key validated successfully
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-[20px] font-bold text-neutral-fg1 tracking-tight">
          Enter API Key
        </h2>
        <p className="text-[13px] text-neutral-fg2 mt-1">
          Get your key from console.anthropic.com
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="apikey-input"
            className="text-[12px] font-medium text-neutral-fg2 mb-1.5 block"
          >
            API Key
          </label>
          <input
            id="apikey-input"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="input-fluent w-full"
          />
        </div>

        {error && (
          <p className="text-[12px] text-danger">{error}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !apiKey.trim()}
          className="btn-primary w-full py-2.5 text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
          ) : (
            "Connect"
          )}
        </button>
      </form>

      <button
        onClick={onBack}
        className="flex items-center justify-center gap-1.5 w-full text-[13px] text-neutral-fg2 transition-colors duration-200 hover:text-neutral-fg1 pt-1"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>
    </div>
  );
}
