import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { useAuthStore } from "./stores/auth";
import { Login, SetupPassword } from "./pages/Login";
import { Landing } from "./pages/Landing";
import { DemoPage } from "./pages/Demo";
import { Settings } from "./pages/Settings";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./pages/app/DashboardPage";
import { AgentsPage } from "./pages/app/AgentsPage";
import { ProjectsPage } from "./pages/app/ProjectsPage";
import { SkillsPage } from "./pages/app/SkillsPage";
import { ChatPage } from "./pages/app/ChatPage";
import { FilesPage } from "./pages/app/FilesPage";
import { PulseLogo } from "./components/brand/PulseLogo";
import { useI18n } from "./i18n";

function LoadingSpinner() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-neutral-bg1 flex flex-col items-center justify-center gap-6">
      <div className="relative flex items-center justify-center">
        {/* Pulsing rings */}
        <div className="absolute -inset-2 rounded-3xl border-2 border-brand/15 animate-[splash-ring_2s_ease-in-out_infinite]" />
        <div className="absolute -inset-4 rounded-[2rem] border-[1.5px] border-brand/8 animate-[splash-ring_2s_ease-in-out_infinite_0.4s]" />
        {/* Logo */}
        <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-stroke bg-neutral-bg1">
          <PulseLogo className="h-8 w-8" />
        </div>
      </div>
      <div className="text-lg font-semibold text-neutral-fg1 tracking-tight">{t("common.productName")}</div>
      <div className="text-[13px] text-neutral-fg3 -mt-3">{t("splash.subtitle")}</div>
      <div className="flex gap-1.5 mt-2">
        <span className="h-[5px] w-[5px] rounded-full bg-brand animate-[splash-dot_1.4s_ease-in-out_infinite]" />
        <span className="h-[5px] w-[5px] rounded-full bg-brand animate-[splash-dot_1.4s_ease-in-out_infinite_0.2s]" />
        <span className="h-[5px] w-[5px] rounded-full bg-brand animate-[splash-dot_1.4s_ease-in-out_infinite_0.4s]" />
      </div>
    </div>
  );
}

function ProtectedAppRoute({ isAuthenticated }: { isAuthenticated: boolean }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <AppLayout />;
}

export function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const needsSetup = useAuthStore((s) => s.needsSetup);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (needsSetup) {
    return <SetupPassword />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <Login />}
        />
        <Route path="/" element={<Landing />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route
          path="/settings"
          element={
            isAuthenticated ? <Settings /> : <Navigate to="/login" />
          }
        />

        <Route path="/app" element={<ProtectedAppRoute isAuthenticated={isAuthenticated} />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="skills" element={<SkillsPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="files" element={<FilesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
