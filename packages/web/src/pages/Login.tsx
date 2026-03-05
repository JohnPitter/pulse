import { useState, type FormEvent } from "react";
import { PulseLogo } from "../components/brand/PulseLogo";
import { LanguageSwitcher } from "../components/common/LanguageSwitcher";
import { useI18n } from "../i18n";
import { useAuthStore } from "../stores/auth";

export function Login() {
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error, login } = useAuthStore();
  const { t } = useI18n();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const success = await login(password);
    if (!success) setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-[340px] animate-fade-up">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher compact />
        </div>

        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-bg2 border border-stroke">
            <PulseLogo className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[16px] font-bold text-text-primary tracking-tight">{t("common.productName")}</p>
            <p className="text-[11px] text-text-disabled">{t("login.subtitle")}</p>
          </div>
        </div>

        <div className="panel p-8">
          <h1 className="text-[20px] font-bold text-text-primary tracking-tight mb-1">{t("login.signInTitle")}</h1>
          <p className="text-[13px] text-text-secondary mb-6">{t("login.signInDescription")}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-[12px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
                {t("login.password")}
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
              {isSubmitting ? t("login.signingIn") : t("login.signInButton")}
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
  const { t } = useI18n();

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
      <div className="w-full max-w-[340px] animate-fade-up">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher compact />
        </div>

        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-bg2 border border-stroke">
            <PulseLogo className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[16px] font-bold text-text-primary tracking-tight">{t("common.productName")}</p>
            <p className="text-[11px] text-text-disabled">{t("login.setupSubtitle")}</p>
          </div>
        </div>

        <div className="panel p-8">
          <h1 className="text-[20px] font-bold text-text-primary tracking-tight mb-1">{t("login.createPasswordTitle")}</h1>
          <p className="text-[13px] text-text-secondary mb-6">{t("login.createPasswordDescription")}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-[12px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
                {t("login.password")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("login.atLeast6")}
                className="input"
                autoFocus
                required
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-[12px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
                {t("login.confirm")}
              </label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t("login.repeatPassword")}
                className="input"
                required
              />
            </div>

            {confirm && !passwordsMatch && (
              <p className="text-[12px] text-danger">{t("login.passwordsDoNotMatch")}</p>
            )}
            {error && (
              <p className="text-[12px] text-danger">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="btn btn-primary w-full py-2.5 text-[13px] font-semibold"
            >
              {isSubmitting ? t("login.settingUp") : t("login.setPassword")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
