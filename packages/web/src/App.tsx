import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { useAuthStore } from "./stores/auth";
import { Login, SetupPassword } from "./pages/Login";
import { Landing } from "./pages/Landing";
import { Settings } from "./pages/Settings";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./pages/app/DashboardPage";
import { AgentsPage } from "./pages/app/AgentsPage";
import { ProjectsPage } from "./pages/app/ProjectsPage";
import { SkillsPage } from "./pages/app/SkillsPage";
import { ChatPage } from "./pages/app/ChatPage";
import { FilesPage } from "./pages/app/FilesPage";

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-orange flex items-center justify-center">
          <span className="text-[15px] font-bold text-white tracking-tight">P</span>
        </div>
        <span className="text-[17px] font-semibold text-text-primary tracking-tight">Pulse</span>
      </div>
      <div className="flex gap-1.5 mt-1">
        <span className="h-[5px] w-[5px] rounded-full bg-orange animate-[pulse-dot_1.4s_ease-in-out_infinite]" />
        <span className="h-[5px] w-[5px] rounded-full bg-orange animate-[pulse-dot_1.4s_ease-in-out_infinite_0.2s]" />
        <span className="h-[5px] w-[5px] rounded-full bg-orange animate-[pulse-dot_1.4s_ease-in-out_infinite_0.4s]" />
      </div>
    </div>
  );
}

export function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const needsSetup = useAuthStore((s) => s.needsSetup);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  if (isLoading) return <LoadingSpinner />;
  if (needsSetup) return <SetupPassword />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/app/dashboard" /> : <Login />} />
        <Route path="/" element={isAuthenticated ? <Navigate to="/app/dashboard" /> : <Landing />} />
        <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/login" />} />

        {/* App shell */}
        <Route
          path="/app"
          element={isAuthenticated ? <AppLayout /> : <Navigate to="/login" />}
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="skills" element={<SkillsPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="files" element={<FilesPage />} />
        </Route>

        {/* Legacy redirect */}
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
