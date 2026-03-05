import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { useAuthStore } from "./stores/auth";
import { Login, SetupPassword } from "./pages/Login";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { Settings } from "./pages/Settings";

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
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Landing />}
        />
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/settings"
          element={isAuthenticated ? <Settings /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}
