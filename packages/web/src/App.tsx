import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useAuthStore } from "./stores/auth";
import { Login } from "./pages/Login";
import { SetupWizard } from "./pages/SetupWizard";
import { Dashboard } from "./pages/Dashboard";
import { AgentView } from "./pages/AgentView";

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
    </div>
  );
}

export function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" /> : <Login />}
        />
        <Route
          path="/setup"
          element={
            isAuthenticated ? <SetupWizard /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/agent/:id"
          element={
            isAuthenticated ? <AgentView /> : <Navigate to="/login" />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
