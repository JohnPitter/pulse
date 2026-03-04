import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { useAuthStore } from "./stores/auth";
import { Login, SetupPassword } from "./pages/Login";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { Settings } from "./pages/Settings";

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-neutral-bg1 flex flex-col items-center justify-center gap-6">
      <div className="relative flex items-center justify-center">
        {/* Pulsing rings */}
        <div className="absolute -inset-2 rounded-3xl border-2 border-brand/15 animate-[splash-ring_2s_ease-in-out_infinite]" />
        <div className="absolute -inset-4 rounded-[2rem] border-[1.5px] border-brand/8 animate-[splash-ring_2s_ease-in-out_infinite_0.4s]" />
        {/* Logo */}
        <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-stroke bg-neutral-bg1">
          <span className="text-[28px] font-bold text-brand">P</span>
        </div>
      </div>
      <div className="text-lg font-semibold text-neutral-fg1 tracking-tight">Pulse</div>
      <div className="text-[13px] text-neutral-fg3 -mt-3">Remote Agent Manager</div>
      <div className="flex gap-1.5 mt-2">
        <span className="h-[5px] w-[5px] rounded-full bg-brand animate-[splash-dot_1.4s_ease-in-out_infinite]" />
        <span className="h-[5px] w-[5px] rounded-full bg-brand animate-[splash-dot_1.4s_ease-in-out_infinite_0.2s]" />
        <span className="h-[5px] w-[5px] rounded-full bg-brand animate-[splash-dot_1.4s_ease-in-out_infinite_0.4s]" />
      </div>
    </div>
  );
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
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
        />
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <Landing />
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/settings"
          element={
            isAuthenticated ? <Settings /> : <Navigate to="/login" />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
