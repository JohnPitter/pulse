import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#2E2E31] p-3 sm:p-6">
      <div className="mx-auto flex h-[calc(100vh-1.5rem)] max-w-[1460px] overflow-hidden rounded-[22px] bg-[#E7E5E2] shadow-[0_26px_70px_rgba(0,0,0,0.45)] sm:h-[calc(100vh-3rem)]">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar />
          <main className="min-h-0 flex-1 overflow-auto p-3">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
