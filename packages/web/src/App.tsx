import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useAuthStore } from "./stores/auth";
import { Login, SetupPassword } from "./pages/Login";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { Settings } from "./pages/Settings";

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-neutral-bg1 flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-brand" />
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
